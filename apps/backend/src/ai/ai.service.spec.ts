import { NotFoundException, BadGatewayException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import type { HttpService } from '@nestjs/axios';
import { promises as dnsPromises } from 'node:dns';
import { AiService } from './ai.service';
import { ProductsService } from '../products/products.service';
import { TransactionsService } from '../transactions/transactions.service';

jest.mock('node:dns', () => ({
  promises: { lookup: jest.fn() },
}));

const mockLookup = dnsPromises.lookup as jest.Mock;

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

describe('AiService.extractFromUrl', () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    mockLookup.mockReset();
    // Default: any hostname resolves to a public IP, so existing tests that
    // never touch DNS behavior still see a normal, unblocked target.
    mockLookup.mockResolvedValue([{ address: '203.0.113.5', family: 4 }]);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('returns fetchable:false for a non-image / failed fetch', async () => {
    globalThis.fetch = (async () => ({ ok: false, status: 404 })) as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('https://cdn.example.com/y.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
  });

  it('returns fetchable:true with attributes when fetch + extract succeed', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    (svc as any).extractFromImage = async () => ({
      attributes: { color: 'Red' },
      confidence: 'high',
      source: 'model',
    });
    const out = await svc.extractFromUrl('https://cdn.example.com/y.png');
    expect(out.fetchable).toBe(true);
    expect(out.attributes).toEqual({ color: 'Red' });
  });

  it('returns fetchable:true attributes:{} when image ok but extractor fails', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => new Uint8Array([1]).buffer,
    })) as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    (svc as any).extractFromImage = async () => {
      throw new Error('extractor down');
    };
    const out = await svc.extractFromUrl('https://cdn.example.com/y.jpg');
    expect(out).toEqual({ fetchable: true, attributes: {} });
  });

  it('rejects non-http(s) urls as not fetchable', async () => {
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('file:///etc/passwd');
    expect(out).toEqual({ fetchable: false, attributes: {} });
  });

  it('blocks cloud metadata (link-local) hosts without calling fetch', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('http://169.254.169.254/latest/meta-data');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks localhost without calling fetch', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('http://localhost/x.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks bare Docker service hostnames without calling fetch', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('http://postgres/x.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('still fetches a public host', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    (svc as any).extractFromImage = async () => ({
      attributes: { color: 'Blue' },
      confidence: 'high',
      source: 'model',
    });
    const out = await svc.extractFromUrl('https://upload.meeshosupplyassets.com/x.png');
    expect(out.fetchable).toBe(true);
  });

  it('rejects when content-length exceeds the size cap, before buffering', async () => {
    globalThis.fetch = (async () => ({
      ok: true,
      headers: {
        get: (h: string) => {
          if (h === 'content-type') return 'image/png';
          if (h === 'content-length') return String(50 * 1024 * 1024);
          return null;
        },
      },
      arrayBuffer: async () => {
        throw new Error('should not be called when content-length already exceeds the cap');
      },
    })) as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('https://upload.meeshosupplyassets.com/huge.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
  });

  it('blocks a public hostname whose DNS resolves to the cloud metadata IP, without fetching it', async () => {
    mockLookup.mockResolvedValue([{ address: '169.254.169.254', family: 4 }]);
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('https://sneaky.example.com/x.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks the IPv4-mapped-IPv6 literal for cloud metadata (::ffff:169.254.169.254)', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('http://[::ffff:169.254.169.254]/x.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks the IPv4-mapped-IPv6 literal for loopback (::ffff:127.0.0.1)', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('http://[::ffff:127.0.0.1]/x.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks 0.0.0.0', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('http://0.0.0.0/x.png');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('blocks a redirect whose Location points at the cloud metadata IP, without ever fetching it as an image', async () => {
    const fetchSpy = jest.fn(async (input: unknown) => {
      const url = String(input);
      if (url === 'https://cdn.example.com/redirector') {
        return {
          ok: false,
          status: 302,
          headers: { get: (h: string) => (h === 'location' ? 'http://169.254.169.254/x' : null) },
        };
      }
      // Should never be reached: the internal redirect target must be blocked
      // before a second fetch is issued.
      return {
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      };
    });
    globalThis.fetch = fetchSpy as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    const out = await svc.extractFromUrl('https://cdn.example.com/redirector');
    expect(out).toEqual({ fetchable: false, attributes: {} });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('still returns fetchable:true for a normal public image whose hostname resolves to a public IP', async () => {
    mockLookup.mockResolvedValue([{ address: '198.51.100.7', family: 4 }]);
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      headers: { get: (h: string) => (h === 'content-type' ? 'image/png' : null) },
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as never;
    const products = {} as unknown as ProductsService;
    const svc = new AiService({} as HttpService, products, {} as TransactionsService);
    (svc as any).extractFromImage = async () => ({
      attributes: { color: 'Green' },
      confidence: 'high',
      source: 'model',
    });
    const out = await svc.extractFromUrl('https://cdn.example.com/normal.png');
    expect(out).toEqual({ fetchable: true, attributes: { color: 'Green' } });
  });
});
