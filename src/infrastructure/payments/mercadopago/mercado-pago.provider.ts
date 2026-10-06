import {
  MercadoPagoConfig,
  Preference,
} from 'mercadopago';

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
    const preference = new Preference(this.client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: input.orderId,
            title: input.title,
            quantity: 1,
            unit_price: input.amount,
            currency_id: 'COP',
          },
        ],
        external_reference: input.orderId,
      },
    });

    if (!response.id) {
      throw new Error('MERCADOPAGO_PREFERENCE_CREATION_FAILED');
    }

    if (!response.init_point) {
      throw new Error('MERCADOPAGO_CHECKOUT_URL_NOT_FOUND');
    }

    return {
      id: response.id,
      checkoutUrl: response.init_point,
    };
  }

  async getPayment(_paymentId: string): Promise<ExternalPayment> {
    throw new Error('NOT_IMPLEMENTED');
  }
}