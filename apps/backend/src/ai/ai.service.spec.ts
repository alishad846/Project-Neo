import { NotFoundException, BadGatewayException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import type { HttpService } from '@nestjs/axios';
import { AiService } from './ai.service';
import { ProductsService } from '../products/products.service';
import { TransactionsService } from '../transactions/transactions.service';

const genome = { id: 1, category: 'Women > Kurtis' } as any;

describe('AiService.extractAttributes', () => {
  it('throws NotFoundException when the product does not exist', async () => {
    const products = { getProductById: async () => undefined } as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    await expect(svc.extractAttributes(999, 'abc')).rejects.toThrow(NotFoundException);
  });

  it('returns the extractor response on success, unmodified', async () => {
    const products = { getProductById: async () => genome } as unknown as ProductsService;
    const result = { attributes: { pattern: 'Solid' }, confidence: 'low', source: 'heuristic' };
    const http = { post: () => of({ data: result }) } as unknown as HttpService;
    const svc = new AiService(http, products, {} as TransactionsService);
    await expect(svc.extractAttributes(1, 'abc')).resolves.toEqual(result);
  });

  it('throws BadGatewayException (never a silent fallback) when the extractor is unreachable', async () => {
    const products = { getProductById: async () => genome } as unknown as ProductsService;
    const http = { post: () => throwError(() => new Error('ECONNREFUSED')) } as unknown as HttpService;
    const svc = new AiService(http, products, {} as TransactionsService);
    await expect(svc.extractAttributes(1, 'abc')).rejects.toThrow(BadGatewayException);
  });
});
