import { UnprocessableEntityException } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import { AiService } from './ai.service';
import { ProductsService } from '../products/products.service';
import { TransactionsService } from '../transactions/transactions.service';

const baseGenome = {
  id: 1, sellerId: 's', sku: 'KURTI-001', title: 'Old Title', brand: 'NeoDemo',
  category: 'Women > Kurtis', colour: 'Blue', fabric: 'Cotton', sizes: ['S', 'M'],
  weight: '0.30', dimensions: null, hsnCode: '6204', costPrice: '250.00',
  sellingPrice: '699.00', images: ['a.jpg'], attributes: { pattern: 'Printed' },
  version: 1, isArchived: false, createdAt: new Date(), updatedAt: new Date(),
} as any;

describe('AiService.publish', () => {
  it('rejects and makes no changes when the compiled listing fails validation', async () => {
    const invalidGenome = { ...baseGenome, hsnCode: '' };
    const updateProduct = jest.fn();
    const products = { getProductById: async () => invalidGenome, updateProduct } as unknown as ProductsService;
    const createGenomeTxn = jest.fn();
    const transactions = { createGenomeTxn } as unknown as TransactionsService;
    const svc = new AiService({} as HttpService, products, transactions);

    await expect(svc.publish(1, 'New Title', { description: 'x' })).rejects.toThrow(UnprocessableEntityException);
    expect(updateProduct).not.toHaveBeenCalled();
    expect(createGenomeTxn).not.toHaveBeenCalled();
  });

  it('snapshots the prior title/attributes before applying the new ones, in that order', async () => {
    const calls: string[] = [];
    const updateProduct = jest.fn(async () => { calls.push('update'); return {}; });
    const products = { getProductById: async () => baseGenome, updateProduct } as unknown as ProductsService;
    const createGenomeTxn = jest.fn(async () => { calls.push('snapshot'); return { id: 7 }; });
    const transactions = { createGenomeTxn } as unknown as TransactionsService;
    const svc = new AiService({} as HttpService, products, transactions);

    const result = await svc.publish(1, 'New Title', { description: 'A great kurti.' });

    expect(calls).toEqual(['snapshot', 'update']);
    expect(createGenomeTxn).toHaveBeenCalledWith(
      [{ productId: 1, previous: { title: 'Old Title', attributes: { pattern: 'Printed' } } }],
      expect.anything(),
    );
    expect(updateProduct).toHaveBeenCalledWith(1, {
      title: 'New Title',
      attributes: { pattern: 'Printed', description: 'A great kurti.' },
    });
    expect(result.txnId).toBe(7);
    expect(result.listing.fields.title).toBe('New Title');
  });

  it('passes edited hsnCode/sellingPrice to updateProduct and snapshots the prior values', async () => {
    const updateProduct = jest.fn(async () => ({}));
    const products = { getProductById: async () => baseGenome, updateProduct } as unknown as ProductsService;
    const createGenomeTxn = jest.fn(async () => ({ id: 9 }));
    const transactions = { createGenomeTxn } as unknown as TransactionsService;
    const svc = new AiService({} as HttpService, products, transactions);

    const result = await svc.publish(1, 'New Title', { description: 'A great kurti.' }, {
      hsnCode: '6205',
      sellingPrice: '799.00',
    });

    expect(createGenomeTxn).toHaveBeenCalledWith(
      [
        {
          productId: 1,
          previous: {
            title: 'Old Title',
            attributes: { pattern: 'Printed' },
            hsnCode: '6204',
            sellingPrice: '699.00',
          },
        },
      ],
      expect.anything(),
    );
    expect(updateProduct).toHaveBeenCalledWith(1, {
      title: 'New Title',
      attributes: { pattern: 'Printed', description: 'A great kurti.' },
      hsnCode: '6205',
      sellingPrice: '799.00',
    });
    expect(result.txnId).toBe(9);
  });

  it('omits hsnCode/sellingPrice from the update when not provided', async () => {
    const updateProduct = jest.fn(async () => ({}));
    const products = { getProductById: async () => baseGenome, updateProduct } as unknown as ProductsService;
    const createGenomeTxn = jest.fn(async () => ({ id: 10 }));
    const transactions = { createGenomeTxn } as unknown as TransactionsService;
    const svc = new AiService({} as HttpService, products, transactions);

    await svc.publish(1, 'New Title', { description: 'A great kurti.' });

    expect(updateProduct).toHaveBeenCalledWith(1, {
      title: 'New Title',
      attributes: { pattern: 'Printed', description: 'A great kurti.' },
    });
  });
});
