import { BadGatewayException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as dns from 'node:dns';
import { compile, validate } from '@neo/adapter-meesho';
import type { CompiledListing, ValidationIssue } from '@neo/adapter';
import type { ProductGenome } from '@neo/genome';
import { ProductsService } from '../products/products.service';
import { TransactionsService } from '../transactions/transactions.service';

export interface ExtractResult {
  attributes: Record<string, unknown>;
  confidence: 'low' | 'medium' | 'high';
  source: 'heuristic' | 'model';
}

export interface PublishResult {
  txnId: number;
  listing: CompiledListing;
  warnings: ValidationIssue[];
}

@Injectable()
export class AiService {
  private readonly extractorUrl = process.env.EXTRACTOR_URL ?? 'http://localhost:8000';

  constructor(
    private readonly httpService: HttpService,
    private readonly productsService: ProductsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async extractAttributes(productId: number, imageBase64: string): Promise<ExtractResult> {
    const genome = await this.productsService.getProductById(productId);
    if (!genome) {
      throw new NotFoundException(`No product with id ${productId}`);
    }
    const priors = genome.sellerId
      ? await this.productsService.getSellerPriors(genome.sellerId, genome.category ?? undefined)
      : undefined;
    return this.callExtractor(imageBase64, genome.category ?? undefined, priors);
  }

  // Image-first extraction used by the production extension: no seeded product
  // needed, just the photo and an optional category hint (the Meesho category
  // the seller is listing under, which sharpens the vision model's prompt).
  async extractFromImage(imageBase64: string, category?: string, sellerId?: string): Promise<ExtractResult> {
    const priors = sellerId ? await this.productsService.getSellerPriors(sellerId, category) : undefined;
    return this.callExtractor(imageBase64, category, priors);
  }

  private async callExtractor(
    imageBase64: string,
    category?: string,
    sellerPriors?: Record<string, unknown>,
  ): Promise<ExtractResult> {
    try {
      const hint: Record<string, unknown> = {};
      if (category) hint.category = category;
      if (sellerPriors) hint.sellerPriors = sellerPriors;
      const response = await firstValueFrom(
        this.httpService.post<ExtractResult>(`${this.extractorUrl}/api/extract`, {
          imageBase64,
          hint,
        }),
      );
      return response.data;
    } catch {
      // Fail safe: if the extraction service is unreachable, surface that
      // clearly. Never silently write a fabricated product to the catalogue.
      throw new BadGatewayException('Could not reach the attribute extraction service.');
    }
  }

  private static readonly MAX_IMAGE_BYTES = 10 * 1024 * 1024;
  private static readonly FETCH_TIMEOUT_MS = 8000;
  private static readonly MAX_REDIRECTS = 3;
  private static readonly REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

  // Blocks SSRF targets by literal string: loopback, link-local (cloud
  // metadata), private ranges, IPv4-mapped IPv6, and bare hostnames (Docker
  // service names on the shared backend's internal network like `postgres`,
  // `ollama`, `extractor`). Case-insensitive. Cheap fast-path; DNS-resolved
  // targets are additionally checked via resolvesToBlockedIp.
  private isBlockedHost(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (host === 'localhost') return true;
    if (this.isBlockedIp(host)) return true;

    // Bare hostname with no dot and no colon (and not an IP) — e.g. Docker
    // service names like `postgres`.
    if (!host.includes('.') && !host.includes(':')) return true;

    return false;
  }

  // Checks a single IP literal (v4 or v6, already lowercased/unbracketed) for
  // loopback / private / link-local / unspecified / unique-local ranges,
  // including IPv4-mapped IPv6 addresses (::ffff:a.b.c.d).
  private isBlockedIp(ip: string): boolean {
    let host = ip;
    const pct = host.indexOf('%');
    if (pct !== -1) host = host.slice(0, pct); // strip zone id

    // IPv4-mapped IPv6: ::ffff:a.b.c.d — check the embedded IPv4.
    const mappedDottedMatch = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mappedDottedMatch) {
      host = mappedDottedMatch[1];
    }

    // IPv4-mapped IPv6, hex-group form: ::ffff:xxxx:yyyy (the WHATWG URL
    // parser normalizes ::ffff:a.b.c.d into this form), each 16-bit group
    // holding two IPv4 octets.
    const mappedHexMatch = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedHexMatch) {
      const g1 = mappedHexMatch[1].padStart(4, '0');
      const g2 = mappedHexMatch[2].padStart(4, '0');
      const a = parseInt(g1.slice(0, 2), 16);
      const b = parseInt(g1.slice(2, 4), 16);
      const c = parseInt(g2.slice(0, 2), 16);
      const d = parseInt(g2.slice(2, 4), 16);
      host = `${a}.${b}.${c}.${d}`;
    }

    // IPv4 checks
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const octets = ipv4Match.slice(1).map(Number);
      if (octets.some((o) => o > 255)) return true; // malformed, be safe
      const [a, b] = octets;
      if (a === 0) return true; // 0.0.0.0/8 (unspecified/"this network")
      if (a === 127) return true; // 127.0.0.0/8
      if (a === 169 && b === 254) return true; // 169.254.0.0/16
      if (a === 10) return true; // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
      return false;
    }

    // IPv6 checks
    if (host.includes(':')) {
      if (host === '::1') return true; // loopback
      if (host === '::') return true; // unspecified
      const firstGroup = host.split(':')[0];
      if (firstGroup.startsWith('fc') || firstGroup.startsWith('fd')) return true; // unique-local fc00::/7
      if (/^fe[89ab][0-9a-f]$/.test(firstGroup)) return true; // link-local fe80::/10
      return false;
    }

    return false;
  }

  // Resolves a hostname via DNS and checks every returned address. Fails
  // safe: an unresolvable hostname (or an empty answer) is treated as
  // blocked so the fetch gate never opens on an unknown target.
  private async resolvesToBlockedIp(hostname: string): Promise<boolean> {
    try {
      const results = await dns.promises.lookup(hostname, { all: true });
      if (!results || results.length === 0) return true;
      return results.some((r) => this.isBlockedIp(r.address.toLowerCase()));
    } catch {
      return true;
    }
  }

  // Combined literal + DNS check used for both the initial URL and every
  // redirect hop target.
  private async isTargetBlocked(url: URL): Promise<boolean> {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;
    if (this.isBlockedHost(url.hostname)) return true;
    if (await this.resolvesToBlockedIp(url.hostname)) return true;
    return false;
  }

  // Fetches a (Meesho CDN) image URL server-side, then runs extraction on it.
  // Serves the bulk wizard's "is this link usable?" gate AND the prefill in one
  // call. Never throws: an unfetchable link is a normal result, not an error.
  async extractFromUrl(
    imageUrl: string,
  ): Promise<{ fetchable: boolean; attributes: Record<string, unknown> }> {
    let initialUrl: URL;
    try {
      initialUrl = new URL(imageUrl);
    } catch {
      return { fetchable: false, attributes: {} };
    }
    if (await this.isTargetBlocked(initialUrl)) {
      return { fetchable: false, attributes: {} };
    }

    let base64: string;
    // One timeout budget covers DNS-validated redirect hops AND the body
    // read — it is only cleared once the body has been fully drained (or the
    // whole operation bails out), never right after the headers arrive.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AiService.FETCH_TIMEOUT_MS);
    try {
      let currentUrl = initialUrl;
      let res: Response | undefined;
      for (let hop = 0; ; hop++) {
        let r: Response;
        try {
          r = await fetch(currentUrl.toString(), { signal: controller.signal, redirect: 'manual' });
        } catch {
          return { fetchable: false, attributes: {} };
        }
        const status = (r as unknown as { status?: number }).status;
        if (status !== undefined && AiService.REDIRECT_STATUSES.has(status)) {
          if (hop >= AiService.MAX_REDIRECTS) {
            return { fetchable: false, attributes: {} };
          }
          const location = r.headers.get('location');
          if (!location) {
            return { fetchable: false, attributes: {} };
          }
          let nextUrl: URL;
          try {
            nextUrl = new URL(location, currentUrl);
          } catch {
            return { fetchable: false, attributes: {} };
          }
          if (await this.isTargetBlocked(nextUrl)) {
            return { fetchable: false, attributes: {} };
          }
          currentUrl = nextUrl;
          continue;
        }
        res = r;
        break;
      }
      if (!res || !res.ok) return { fetchable: false, attributes: {} };
      // Content-type gate is intentionally lenient: Meesho's CDN (Google Cloud
      // Storage) serves images as `application/octet-stream`, not `image/*`, so
      // a strict image/* check wrongly rejected every valid link. Accept image/*,
      // octet-stream, or an absent content-type, or a URL that ends in a known
      // image extension. Only reject content-types that are clearly NOT images
      // (HTML/JSON error pages). SSRF is already handled by the host/IP checks;
      // the body never returns to the caller (only to the local extractor), so
      // this gate's job is just "don't feed an obvious error page to the model".
      const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
      const looksLikeImage =
        contentType.startsWith('image/') ||
        contentType.startsWith('application/octet-stream') ||
        contentType === '' ||
        /\.(jpe?g|png|webp|gif|bmp|avif)(?:$|\?)/i.test(currentUrl.pathname);
      const isNonImageDocument =
        contentType.startsWith('text/') ||
        contentType.startsWith('application/json') ||
        contentType.startsWith('application/xml');
      if (!looksLikeImage || isNonImageDocument) {
        return { fetchable: false, attributes: {} };
      }
      const contentLength = res.headers.get('content-length');
      if (contentLength) {
        const declaredSize = Number(contentLength);
        if (!Number.isNaN(declaredSize) && declaredSize > AiService.MAX_IMAGE_BYTES) {
          return { fetchable: false, attributes: {} };
        }
      }

      let buf: Buffer;
      const body = res.body as unknown as { getReader?: () => ReadableStreamDefaultReader<Uint8Array> } | null;
      if (body && typeof body.getReader === 'function') {
        // Stream + enforce the cap while reading so we never buffer an
        // unbounded body before checking its size.
        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let total = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            total += value.byteLength;
            if (total > AiService.MAX_IMAGE_BYTES) {
              try {
                await reader.cancel();
              } catch {
                /* best-effort cancel */
              }
              return { fetchable: false, attributes: {} };
            }
            chunks.push(value);
          }
        }
        buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
      } else {
        // Fallback for fetch implementations/mocks without a streamable body.
        buf = Buffer.from(await res.arrayBuffer());
      }
      if (buf.byteLength === 0 || buf.byteLength > AiService.MAX_IMAGE_BYTES) {
        return { fetchable: false, attributes: {} };
      }
      base64 = buf.toString('base64');
    } catch {
      return { fetchable: false, attributes: {} };
    } finally {
      clearTimeout(timer);
    }

    try {
      const result = await this.extractFromImage(base64);
      return { fetchable: true, attributes: result.attributes ?? {} };
    } catch {
      // Image is usable (gate passes) but extraction failed — prefill is optional.
      return { fetchable: true, attributes: {} };
    }
  }

  // Fire-and-forget model warmup. The extension calls this when the seller
  // opens the AI Autofill tab so the vision model is loading into (V)RAM while
  // they pick a photo — turning the ~45s cold-load into a no-op by the time
  // they hit Analyze. Never throws: a cold model just means the first extract
  // is slow, exactly as before.
  async warmup(): Promise<{ ok: boolean }> {
    try {
      await firstValueFrom(this.httpService.post(`${this.extractorUrl}/api/warmup`, {}));
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  async publish(
    productId: number,
    title: string,
    attributes: Record<string, unknown>,
    genomeEdits?: { hsnCode?: string; sellingPrice?: string },
  ): Promise<PublishResult> {
    const current = await this.productsService.getProductById(productId);
    if (!current) {
      throw new NotFoundException(`No product with id ${productId}`);
    }

    const hsnCode = genomeEdits?.hsnCode;
    const sellingPrice = genomeEdits?.sellingPrice;

    const mergedAttributes = { ...((current.attributes as Record<string, unknown>) ?? {}), ...attributes };
    // Drizzle's select type is structurally compatible with ProductGenome (same
    // column shapes); cast once here to compile() the draft without persisting it.
    const draftGenome = {
      ...current,
      title,
      attributes: mergedAttributes,
      ...(hsnCode !== undefined ? { hsnCode } : {}),
      ...(sellingPrice !== undefined ? { sellingPrice } : {}),
    } as ProductGenome;
    const listing = compile(draftGenome, current.category ?? 'uncategorised');
    const issues = validate(listing);
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      throw new UnprocessableEntityException({ message: 'Listing failed validation', issues });
    }

    const update = {
      title,
      attributes: mergedAttributes,
      ...(hsnCode !== undefined ? { hsnCode } : {}),
      ...(sellingPrice !== undefined ? { sellingPrice } : {}),
    };
    const txn = await this.transactionsService.createGenomeTxn(
      [
        {
          productId,
          previous: {
            title: current.title,
            attributes: current.attributes,
            ...(hsnCode !== undefined ? { hsnCode: current.hsnCode } : {}),
            ...(sellingPrice !== undefined ? { sellingPrice: current.sellingPrice } : {}),
          },
        },
      ],
      update,
    );
    await this.productsService.updateProduct(productId, update);

    return { txnId: txn.id, listing, warnings: issues.filter((i) => i.severity === 'warning') };
  }

  async undo(txnId: number) {
    return this.transactionsService.rollbackGenomeTxn(txnId);
  }
}
