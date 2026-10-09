
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Order } from 'mercadopago';

import { ApplicationError } from '../../../application/errors/application-error';
import {
  CreateExternalPaymentInput,
  CreateExternalPaymentResult,
  ExternalPayment,
  PaymentProvider,
} from '../../../domain/ports/payment.provider';

export class MercadoPagoProvider implements PaymentProvider {
  private readonly client: MercadoPagoConfig;

  constructor(accessToken: string) {
    this.client = new MercadoPagoConfig({
      accessToken,
    });
  }

  async createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult> {
    const orderClient = new Order(this.client);

    const body = {
      type: 'online',
      processing_mode: 'manual',
      total_amount: String(input.amount),
      external_reference: input.orderId,
      payer: {
        email: 'test@testuser.com',
      },
      items: [
        {
          title: input.title,
          quantity: 1,
          unit_price: String(input.amount),
        },
      ],
    };

    let response;

    try {
      response = await orderClient.create({
        body,
        requestOptions: {
          idempotencyKey: randomUUID(),
        },
      });
    } catch {
      console.error('[MercadoPago] Failed to create external order');

      throw new ApplicationError(
        'MERCADOPAGO_REQUEST_FAILED',
        503,
      );
    }

    if (!response.id) {
      console.error('[MercadoPago] External order response has no ID');

      throw new ApplicationError(
        'MERCADOPAGO_ORDER_CREATION_FAILED',
        503,
      );
    }

    if (!response.checkout_url) {
      console.error('[MercadoPago] External order response has no checkout URL');

      throw new ApplicationError(
        'MERCADOPAGO_CHECKOUT_URL_NOT_FOUND',
        503,
      );
    }

    return {
      externalOrderId: String(response.id),
      checkoutUrl: response.checkout_url,
    };
  }

  async getPayment(
    externalOrderId: string,
  ): Promise<ExternalPayment> {
    const orderClient = new Order(this.client);

    let response;

    try {
      response = await orderClient.get({
        id: externalOrderId,
      });
    } catch {
      console.error('[MercadoPago] Failed to retrieve external order');

      throw new ApplicationError(
        'MERCADOPAGO_REQUEST_FAILED',
        503,
      );
    }

    if (!response.id) {
      throw new ApplicationError(
        'MERCADOPAGO_ORDER_NOT_FOUND',
        503,
      );
    }

    const transactionPayment =
      response.transactions?.payments?.[0];

    if (!transactionPayment) {
      throw new ApplicationError(
        'MERCADOPAGO_PAYMENT_NOT_FOUND',
        503,
      );
    }

    return {
      id: String(transactionPayment.id),
      externalOrderId: String(response.id),
      status:
        transactionPayment.status ??
        response.status ??
        'unknown',
      amount:
        Number(transactionPayment.amount) || 0,
      orderId:
        response.external_reference ?? null,
    };
  }
}
