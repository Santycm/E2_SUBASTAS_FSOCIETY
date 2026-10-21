
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Order } from 'mercadopago';

import { ApplicationError } from '../../../src/application/errors/application-error';
import { MercadoPagoProvider } from '../../../src/infrastructure/payments/mercadopago/mercado-pago.provider';

describe('MercadoPagoProvider', () => {
  const provider = new MercadoPagoProvider('test-access-token');

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPayment', () => {
    const input = {
      orderId: 'order-001',
      amount: 150000,
      title: 'Laptop usado',
      description: 'Laptop en buen estado',
      categoryId: 'electronics',
    };

    it('creates an external order and returns its checkout URL', async () => {
      const createSpy = jest
        .spyOn(Order.prototype, 'create')
        .mockResolvedValue({
          id: 'external-order-001',
          checkout_url: 'https://checkout.example.com/order-001',
        } as never);

      const result = await provider.createPayment(input);

      expect(result).toEqual({
        externalOrderId: 'external-order-001',
        checkoutUrl: 'https://checkout.example.com/order-001',
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            type: 'online',
            processing_mode: 'manual',
            total_amount: '150000',
            external_reference: 'order-001',
            payer: {
              email: 'test@testuser.com',
            },
            items: [
              {
                title: 'Laptop usado',
                quantity: 1,
                unit_price: '150000',
              },
            ],
          }),
          requestOptions: {
            idempotencyKey: expect.any(String),
          },
        }),
      );
    });

    it('throws MERCADOPAGO_REQUEST_FAILED when the request fails', async () => {
      jest.spyOn(Order.prototype, 'create').mockRejectedValue(
        new Error('Mercado Pago unavailable'),
      );

      await expect(provider.createPayment(input)).rejects.toMatchObject({
        code: 'MERCADOPAGO_REQUEST_FAILED',
        statusCode: 503,
      });
    });

    it('throws MERCADOPAGO_ORDER_CREATION_FAILED when the response has no ID', async () => {
      jest.spyOn(Order.prototype, 'create').mockResolvedValue({
        checkout_url: 'https://checkout.example.com/order-001',
      } as never);

      await expect(provider.createPayment(input)).rejects.toMatchObject({
        code: 'MERCADOPAGO_ORDER_CREATION_FAILED',
        statusCode: 503,
      });
    });

    it('throws MERCADOPAGO_CHECKOUT_URL_NOT_FOUND when the response has no checkout URL', async () => {
      jest.spyOn(Order.prototype, 'create').mockResolvedValue({
        id: 'external-order-001',
      } as never);

      await expect(provider.createPayment(input)).rejects.toMatchObject({
        code: 'MERCADOPAGO_CHECKOUT_URL_NOT_FOUND',
        statusCode: 503,
      });
    });

    it('converts a numeric external order ID to a string', async () => {
      jest.spyOn(Order.prototype, 'create').mockResolvedValue({
        id: 12345,
        checkout_url: 'https://checkout.example.com/order-001',
      } as never);

      const result = await provider.createPayment(input);

      expect(result.externalOrderId).toBe('12345');
    });
  });

  describe('getPayment', () => {
    const externalOrderId = 'external-order-001';

    it('retrieves an external payment with all its details', async () => {
      const getSpy = jest
        .spyOn(Order.prototype, 'get')
        .mockResolvedValue({
          id: 'external-order-001',
          status: 'processed',
          external_reference: 'order-001',
          transactions: {
            payments: [
              {
                id: 98765,
                status: 'processed',
                amount: 150000,
              },
            ],
          },
        } as never);

      const result = await provider.getPayment(externalOrderId);

      expect(result).toEqual({
        id: '98765',
        externalOrderId: 'external-order-001',
        status: 'processed',
        amount: 150000,
        orderId: 'order-001',
      });

      expect(getSpy).toHaveBeenCalledWith({
        id: externalOrderId,
      });
    });

    it('throws MERCADOPAGO_REQUEST_FAILED when the request fails', async () => {
      jest.spyOn(Order.prototype, 'get').mockRejectedValue(
        new Error('Mercado Pago unavailable'),
      );

      await expect(
        provider.getPayment(externalOrderId),
      ).rejects.toMatchObject({
        code: 'MERCADOPAGO_REQUEST_FAILED',
        statusCode: 503,
      });
    });

    it('throws MERCADOPAGO_ORDER_NOT_FOUND when the response has no order ID', async () => {
      jest.spyOn(Order.prototype, 'get').mockResolvedValue({
        status: 'processed',
        transactions: {
          payments: [
            {
              id: 'external-payment-001',
              status: 'processed',
              amount: 150000,
            },
          ],
        },
      } as never);

      await expect(
        provider.getPayment(externalOrderId),
      ).rejects.toMatchObject({
        code: 'MERCADOPAGO_ORDER_NOT_FOUND',
        statusCode: 503,
      });
    });

    it('throws MERCADOPAGO_PAYMENT_NOT_FOUND when the order has no payments', async () => {
      jest.spyOn(Order.prototype, 'get').mockResolvedValue({
        id: 'external-order-001',
        status: 'processed',
        transactions: {
          payments: [],
        },
      } as never);

      await expect(
        provider.getPayment(externalOrderId),
      ).rejects.toMatchObject({
        code: 'MERCADOPAGO_PAYMENT_NOT_FOUND',
        statusCode: 503,
      });
    });

    it('throws MERCADOPAGO_PAYMENT_NOT_FOUND when transactions are missing', async () => {
      jest.spyOn(Order.prototype, 'get').mockResolvedValue({
        id: 'external-order-001',
        status: 'processed',
      } as never);

      await expect(
        provider.getPayment(externalOrderId),
      ).rejects.toMatchObject({
        code: 'MERCADOPAGO_PAYMENT_NOT_FOUND',
        statusCode: 503,
      });
    });

    it('uses the order status when the payment status is missing', async () => {
      jest.spyOn(Order.prototype, 'get').mockResolvedValue({
        id: 'external-order-001',
        status: 'processed',
        external_reference: 'order-001',
        transactions: {
          payments: [
            {
              id: 'external-payment-001',
              amount: 150000,
            },
          ],
        },
      } as never);

      const result = await provider.getPayment(externalOrderId);

      expect(result.status).toBe('processed');
    });

    it('uses unknown when both payment and order statuses are missing', async () => {
      jest.spyOn(Order.prototype, 'get').mockResolvedValue({
        id: 'external-order-001',
        transactions: {
          payments: [
            {
              id: 'external-payment-001',
              amount: 150000,
            },
          ],
        },
      } as never);

      const result = await provider.getPayment(externalOrderId);

      expect(result.status).toBe('unknown');
    });

    it('uses zero when the payment amount is missing or invalid', async () => {
      const getSpy = jest.spyOn(Order.prototype, 'get');

      getSpy.mockResolvedValueOnce({
        id: 'external-order-001',
        transactions: {
          payments: [
            {
              id: 'external-payment-001',
            },
          ],
        },
      } as never);

      getSpy.mockResolvedValueOnce({
        id: 'external-order-001',
        transactions: {
          payments: [
            {
              id: 'external-payment-001',
              amount: 'invalid',
            },
          ],
        },
      } as never);

      await expect(
        provider.getPayment(externalOrderId),
      ).resolves.toMatchObject({ amount: 0 });

      await expect(
        provider.getPayment(externalOrderId),
      ).resolves.toMatchObject({ amount: 0 });
    });

    it('returns a null order ID when the external reference is missing', async () => {
      jest.spyOn(Order.prototype, 'get').mockResolvedValue({
        id: 'external-order-001',
        transactions: {
          payments: [
            {
              id: 'external-payment-001',
              status: 'processed',
              amount: 150000,
            },
          ],
        },
      } as never);

      const result = await provider.getPayment(externalOrderId);

      expect(result.orderId).toBeNull();
    });

    it('throws ApplicationError with status 503 for provider failures', async () => {
      jest.spyOn(Order.prototype, 'get').mockRejectedValue(
        new Error('Network error'),
      );

      try {
        await provider.getPayment(externalOrderId);
        throw new Error('Expected getPayment to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(ApplicationError);
        expect(error).toMatchObject({
          code: 'MERCADOPAGO_REQUEST_FAILED',
          statusCode: 503,
        });
      }
    });
  });
});
