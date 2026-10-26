
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from 'mercadopago';

import { HandlePaymentWebhookUseCase } from '../../../../src/application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';
import { PaymentController } from '../../../../src/infrastructure/http/controllers/payment.controller';

describe('PaymentController', () => {
  const execute = jest.fn<
    (input: { externalOrderId: string; eventId: string }) => Promise<unknown>
  >();

  let controller: PaymentController;
  let status: jest.Mock;
  let json: jest.Mock;
  let headers: Record<string, string | undefined>;

  const createRequest = (externalOrderId: unknown): Request =>
    ({
      query: { 'data.id': externalOrderId },
      body: { application_id: 'application-123' },
      header: (name: string) => headers[name.toLowerCase()],
    }) as unknown as Request;

  const createResponse = (): Response => {
    status = jest.fn().mockReturnThis();
    json = jest.fn().mockReturnThis();

    return { status, json } as unknown as Response;
  };

  const defaultExternalOrderId = Symbol('defaultExternalOrderId');

  const sendWebhook = async (
    externalOrderId: unknown = defaultExternalOrderId,
  ) => {
    const req = createRequest(
      externalOrderId === defaultExternalOrderId
        ? 'external-order-123'
        : externalOrderId,
    );
    const res = createResponse();

    await controller.webhook(req, res);

    return { req, res };
  };

  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue(undefined);

    headers = {
      'x-request-id': 'event-123',
      'x-signature': 'ts=123,v1=signature',
    };

    controller = new PaymentController(
      { execute } as unknown as HandlePaymentWebhookUseCase,
      'webhook-secret',
    );

    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when the external order ID is missing', async () => {
    const req = {
      query: {},
      body: { application_id: 'application-123' },
      header: (name: string) => headers[name.toLowerCase()],
    } as unknown as Request;
    const res = createResponse();

    await controller.webhook(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'MISSING_EXTERNAL_ORDER_ID',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 400 when the external order ID is blank', async () => {
    await sendWebhook('   ');

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'MISSING_EXTERNAL_ORDER_ID',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 400 when the external order ID is not a string', async () => {
    await sendWebhook(['external-order-123']);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'MISSING_EXTERNAL_ORDER_ID',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 400 when the event ID is missing', async () => {
    delete headers['x-request-id'];

    await sendWebhook();

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'MISSING_EVENT_ID',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('processes the webhook when the signature is valid', async () => {
    const validateSpy = jest
      .spyOn(WebhookSignatureValidator, 'validate')
      .mockImplementation(() => undefined);

    await sendWebhook();

    expect(validateSpy).toHaveBeenCalledWith({
      xSignature: 'ts=123,v1=signature',
      xRequestId: 'event-123',
      dataId: 'external-order-123',
      secret: 'webhook-secret',
      toleranceSeconds: 300,
    });
    expect(execute).toHaveBeenCalledWith({
      externalOrderId: 'external-order-123',
      eventId: 'event-123',
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ received: true });
  });

  it('returns 401 when the signature is invalid and reconciliation is disabled', async () => {
    jest
      .spyOn(WebhookSignatureValidator, 'validate')
      .mockImplementation(() => {
        throw Object.create(InvalidWebhookSignatureError.prototype);
      });

    await sendWebhook();

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: 'INVALID_SIGNATURE',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 401 when the signature is missing', async () => {
    delete headers['x-signature'];

    await sendWebhook();

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: 'INVALID_SIGNATURE',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 401 when the webhook secret is empty', async () => {
    controller = new PaymentController(
      { execute } as unknown as HandlePaymentWebhookUseCase,
      '',
    );

    await sendWebhook();

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: 'INVALID_SIGNATURE',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns 500 when signature validation throws an unexpected error', async () => {
    jest
      .spyOn(WebhookSignatureValidator, 'validate')
      .mockImplementation(() => {
        throw new Error('Unexpected validation error');
      });

    await sendWebhook();

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'SIGNATURE_VALIDATION_ERROR',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('processes the webhook without a verified signature when reconciliation is enabled', async () => {
    controller = new PaymentController(
      { execute } as unknown as HandlePaymentWebhookUseCase,
      'webhook-secret',
      true,
    );

    delete headers['x-signature'];

    await sendWebhook();

    expect(execute).toHaveBeenCalledWith({
      externalOrderId: 'external-order-123',
      eventId: 'event-123',
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ received: true });
  });

  it('returns 500 when webhook processing fails', async () => {
    execute.mockRejectedValue(new Error('Reconciliation failed'));

    jest
      .spyOn(WebhookSignatureValidator, 'validate')
      .mockImplementation(() => undefined);

    await sendWebhook();

    expect(execute).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'WEBHOOK_PROCESSING_FAILED',
    });
  });

  it('handles a non-Error value when webhook processing fails', async () => {
    execute.mockRejectedValue('unexpected failure');

    jest
      .spyOn(WebhookSignatureValidator, 'validate')
      .mockImplementation(() => undefined);

    await sendWebhook();

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: 'WEBHOOK_PROCESSING_FAILED',
    });
    expect(console.error).toHaveBeenCalledWith(
      '[PaymentWebhook] Payment reconciliation failed',
      expect.objectContaining({
        errorName: 'UnknownError',
        errorMessage: 'unexpected failure',
      }),
    );
  });
});
