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
    return this.callExtractor(imageBase64, genome.category ?? undefined);
  }

  // Image-first extraction used by the production extension: no seeded product
  // needed, just the photo and an optional category hint (the Meesho category
  // the seller is listing under, which sharpens moondream's prompt).
  async extractFromImage(imageBase64: string, category?: string): Promise<ExtractResult> {
    return this.callExtractor(imageBase64, category);
  }

  private async callExtractor(imageBase64: string, category?: string): Promise<ExtractResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<ExtractResult>(`${this.extractorUrl}/api/extract`, {
          imageBase64,
          hint: category ? { category } : {},
        }),
      );
      return response.data;
    } catch {
      // Fail safe: if the extraction service is unreachable, surface that
      // clearly. Never silently write a fabricated product to the catalogue.
      throw new BadGatewayException('Could not reach the attribute extraction service.');
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
