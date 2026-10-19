import type { Application } from 'express';
import request from 'supertest';
import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import app from '../../../src/app';
import type { AuctionEventPublisher } from '../../../src/domain/ports/auction-event.publisher';

const testJwtSecret = 'integration-test-only-secret';
const testMercadoPagoToken = 'integration-test-token';

let registerRoutes: (
  app: Application,
  publisher: AuctionEventPublisher,
) => void;

const auctionEventPublisher: AuctionEventPublisher = {
  publishBidPlaced: () => {},
  publishBidOutbid: () => {},
  publishAuctionClosed: () => {},
};

beforeAll(async () => {
  process.env.JWT_SECRET ||= testJwtSecret;
  process.env.JWT_ISSUER ||= 'subastas-issuer-app';
  process.env.JWT_AUDIENCE ||= 'subastas-app-audience';
  process.env.JWT_EXPIRES_IN ||= '1d';
  process.env.MERCADOPAGO_ACCESS_TOKEN ||= testMercadoPagoToken;

  const routesModule = await import(
    '../../../src/infrastructure/http/routes'
  );

  registerRoutes = routesModule.registerRoutes;
  registerRoutes(app, auctionEventPublisher);
});

describe('HTTP API', () => {
  describe('GET /health', () => {
    it('returns 200 and the API health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
      });
    });
  });

  describe('Not found', () => {
    it('returns 404 for an unknown route', async () => {
      const response = await request(app).get(
        '/api/v1/route-that-does-not-exist',
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: 'ROUTE_NOT_FOUND',
      });
    });
  });

  describe('JSON parsing', () => {
    it('returns 400 when the request body contains invalid JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"name":');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'INVALID_JSON',
      });
    });
  });

  describe('Authentication validation', () => {
    it('returns 400 when registration data is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('returns 400 when login data is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Category validation', () => {
    it('returns 400 when the category ID is not a valid MongoDB ID', async () => {
      const response = await request(app).get(
        '/api/v1/categories/invalid-id',
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('VALIDATION_ERROR');

      const messages = response.body.errors.map(
        (error: { msg: string }) => error.msg,
      );

      expect(messages).toContain('CATEGORY_ID_INVALID');
    });
  });

  describe('Auction validation', () => {
    it('returns 400 when the auction ID is not a valid MongoDB ID', async () => {
      const response = await request(app).get(
        '/api/v1/auctions/invalid-id',
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('VALIDATION_ERROR');

      const messages = response.body.errors.map(
        (error: { msg: string }) => error.msg,
      );

      expect(messages).toContain('AUCTION_ID_INVALID');
    });

    it('returns 400 when auction filters contain invalid values', async () => {
      const response = await request(app).get(
        '/api/v1/auctions',
      ).query({
        categoryId: 'invalid-id',
        status: 'INVALID',
        page: 0,
        limit: 101,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('VALIDATION_ERROR');

      const messages = response.body.errors.map(
        (error: { msg: string }) => error.msg,
      );

      expect(messages).toEqual(
        expect.arrayContaining([
          'CATEGORY_ID_INVALID',
          'STATUS_INVALID',
          'PAGE_INVALID',
          'LIMIT_INVALID',
        ]),
      );
    });
  });

  describe('Protected routes', () => {
    it('rejects requests without an authorization header', async () => {
      const response = await request(app).get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'UNAUTHORIZED',
      });
    });

    it('rejects an invalid authorization scheme', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Basic invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'INVALID_AUTHORIZATION_HEADER',
      });
    });

    it('rejects an invalid bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'INVALID_TOKEN',
      });
    });

    it('rejects creating an auction without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auctions')
        .send({
          title: 'Test auction',
          description: 'Auction for HTTP tests',
          categoryId: '507f1f77bcf86cd799439011',
          basePrice: 100,
          minimumIncrement: 10,
          closesAt: '2030-01-01T12:00:00.000Z',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'UNAUTHORIZED',
      });
    });
  });
});