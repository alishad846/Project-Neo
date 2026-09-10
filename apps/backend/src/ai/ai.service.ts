import { BadGatewayException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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

  // Blocks SSRF targets: loopback, link-local (cloud metadata), private
  // ranges, and bare hostnames (Docker service names on the shared backend's
  // internal network like `postgres`, `ollama`, `extractor`). Case-insensitive.
  private isBlockedHost(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (host === 'localhost' || host === '::1') return true;

    // IPv4 checks
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const octets = ipv4Match.slice(1).map(Number);
      if (octets.some((o) => o > 255)) return true; // malformed, be safe
      const [a, b] = octets;
      if (a === 127) return true; // 127.0.0.0/8
      if (a === 169 && b === 254) return true; // 169.254.0.0/16
      if (a === 10) return true; // 10.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
      return false;
    }

    // IPv6 unique-local fc00::/7 (prefixes fc/fd)
    if (host.includes(':')) {
      const firstGroup = host.split(':')[0];
      if (firstGroup.startsWith('fc') || firstGroup.startsWith('fd')) return true;
      return false;
    }

    // Bare hostname with no dot (and not an IP) — e.g. Docker service names.
    if (!host.includes('.')) return true;

    return false;
  }

  // Fetches a (Meesho CDN) image URL server-side, then runs extraction on it.
  // Serves the bulk wizard's "is this link usable?" gate AND the prefill in one
  // call. Never throws: an unfetchable link is a normal result, not an error.
  async extractFromUrl(
    imageUrl: string,
  ): Promise<{ fetchable: boolean; attributes: Record<string, unknown> }> {
    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      return { fetchable: false, attributes: {} };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { fetchable: false, attributes: {} };
    }
    if (this.isBlockedHost(url.hostname)) {
      return { fetchable: false, attributes: {} };
    }

    let base64: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AiService.FETCH_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(imageUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) return { fetchable: false, attributes: {} };
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        return { fetchable: false, attributes: {} };
      }
      const contentLength = res.headers.get('content-length');
      if (contentLength) {
        const declaredSize = Number(contentLength);
        if (!Number.isNaN(declaredSize) && declaredSize > AiService.MAX_IMAGE_BYTES) {
          return { fetchable: false, attributes: {} };
        }
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength === 0 || buf.byteLength > AiService.MAX_IMAGE_BYTES) {
        return { fetchable: false, attributes: {} };
      }
      base64 = buf.toString('base64');
    } catch {
      return { fetchable: false, attributes: {} };
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
