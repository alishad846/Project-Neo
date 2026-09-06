import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { AuthModule } from './auth.module';
import { ProductsController } from '../products/products.controller';
import { ProductsService } from '../products/products.service';
import { PricingController } from '../pricing/pricing.controller';
import { PricingService } from '../pricing/pricing.service';
import { AiController } from '../ai/ai.controller';
import { AiService } from '../ai/ai.service';

/**
 * Real HTTP-level (e2e-style) proof that JwtAuthGuard is actually wired onto
 * the products/pricing/ai controllers: bootstraps a Nest app per controller
 * (with its service mocked out so no DB/network is touched), fires a real
 * request through supertest, and asserts on the resulting status code. The
 * "authorized" case signs a token with the same JwtService/secret the guard
 * verifies against, so a 200 there proves the guard genuinely accepts valid
 * tokens rather than the route merely being unguarded.
 */
describe('JwtAuthGuard enforcement on protected routes', () => {
  let jwtService: JwtService;
  let validToken: string;

  async function buildApp(
    controller: any,
    providerToken: any,
    providerValue: unknown,
  ): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [controller],
      providers: [{ provide: providerToken, useValue: providerValue }],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
    jwtService = moduleRef.get(JwtService);
    validToken = await jwtService.signAsync({ sub: 1, email: 'seller@example.com' });
  });

  describe('GET /products', () => {
    let app: INestApplication;
    const mockProductsService = { getAllProducts: jest.fn(async () => [{ id: 1 }]) };

    beforeAll(async () => {
      app = await buildApp(ProductsController, ProductsService, mockProductsService);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 with no Authorization header', async () => {
      await request(app.getHttpServer()).get('/products').expect(401);
    });

    it('returns 401 with a malformed/invalid token', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });

    it('succeeds with a valid Bearer token signed by the same JwtService', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      expect(res.body).toEqual([{ id: 1 }]);
      expect(mockProductsService.getAllProducts).toHaveBeenCalled();
    });
  });

  describe('POST /pricing/dry-run', () => {
    let app: INestApplication;
    const mockPricingService = { calculateDryRun: jest.fn(async () => ({ totalSkus: 0, diffs: [] })) };

    beforeAll(async () => {
      app = await buildApp(PricingController, PricingService, mockPricingService);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 with no Authorization header', async () => {
      await request(app.getHttpServer())
        .post('/pricing/dry-run')
        .send({ actionType: 'PERCENTAGE_DISCOUNT', actionValue: 10 })
        .expect(401);
    });

    it('succeeds with a valid Bearer token', async () => {
      await request(app.getHttpServer())
        .post('/pricing/dry-run')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ actionType: 'PERCENTAGE_DISCOUNT', actionValue: 10 })
        .expect(201);
      expect(mockPricingService.calculateDryRun).toHaveBeenCalled();
    });
  });

  describe('POST /ai/extract', () => {
    let app: INestApplication;
    const mockAiService = {
      extractFromImage: jest.fn(async () => ({ attributes: {}, confidence: 'low', source: 'heuristic' })),
    };

    beforeAll(async () => {
      app = await buildApp(AiController, AiService, mockAiService);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 401 with no Authorization header', async () => {
      await request(app.getHttpServer())
        .post('/ai/extract')
        .send({ imageBase64: 'abc' })
        .expect(401);
    });

    it('succeeds with a valid Bearer token', async () => {
      await request(app.getHttpServer())
        .post('/ai/extract')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ imageBase64: 'abc' })
        .expect(201);
      expect(mockAiService.extractFromImage).toHaveBeenCalled();
    });
  });
});
