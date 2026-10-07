import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Order } from 'mercadopago';

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

    try {
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

      const response = await orderClient.create({
        body,
        requestOptions: {
          idempotencyKey: randomUUID(),
        },
      });

      if (!response.id) {
        throw new Error(
          'MERCADOPAGO_ORDER_CREATION_FAILED',
        );
      }

      if (!response.checkout_url) {
        throw new Error(
          'MERCADOPAGO_CHECKOUT_URL_NOT_FOUND',
        );
      }

      return {
        externalOrderId: String(response.id),
        checkoutUrl: response.checkout_url,
      };
    } catch (error) {
      console.error(
        '========== MERCADO PAGO ERROR ==========',
      );

      console.dir(error, {
        depth: null,
      });

      console.error(
        '========================================',
      );

      throw error;
    }
  }

  async getPayment(
    externalOrderId: string,
  ): Promise<ExternalPayment> {
    const orderClient = new Order(this.client);

    const response = await orderClient.get({
      id: externalOrderId,
    });

    if (!response.id) {
      throw new Error(
        'MERCADOPAGO_ORDER_NOT_FOUND',
      );
    }

    const transactionPayment =
      response.transactions?.payments?.[0];

    if (!transactionPayment) {
      throw new Error(
        'MERCADOPAGO_PAYMENT_NOT_FOUND',
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
