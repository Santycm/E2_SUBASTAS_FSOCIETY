import { Router } from 'express';

import { MongoosePaymentRepository } from '../../persistence/mongoose/repositories/mongoose-payment.repository';
import { MongoosePaymentSettlementRepository } from '../../persistence/mongoose/repositories/mongoose-payment-settlement.repository';

import { HandlePaymentWebhookUseCase } from '../../../application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';

import { PaymentController } from '../controllers/payment.controller';

import { MercadoPagoProvider } from '../../payments/mercadopago/mercado-pago.provider';

const router: Router = Router();

const paymentRepository = new MongoosePaymentRepository();
const paymentSettlementRepository =
  new MongoosePaymentSettlementRepository();

const mercadoPagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!mercadoPagoAccessToken) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN_NOT_CONFIGURED');
}

const paymentProvider = new MercadoPagoProvider(
  mercadoPagoAccessToken,
);

const handlePaymentWebhookUseCase =
  new HandlePaymentWebhookUseCase(
    paymentRepository,
    paymentSettlementRepository,
    paymentProvider,
  );

const mercadoPagoWebhookSecret =
  process.env.MERCADOPAGO_WEBHOOK_SECRET;

if (!mercadoPagoWebhookSecret) {
  throw new Error('MERCADOPAGO_WEBHOOK_SECRET_NOT_CONFIGURED');
}

const controller = new PaymentController(
  handlePaymentWebhookUseCase,
  mercadoPagoWebhookSecret,
  process.env.ALLOW_UNVERIFIED_WEBHOOK_RECONCILIATION === 'true',
);

router.post('/webhook', controller.webhook);

export default router;