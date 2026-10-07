import { Router } from 'express';

import { MongooseOrderRepository } from '../../persistence/mongoose/repositories/mongoose-order.repository';
import { MongoosePaymentRepository } from '../../persistence/mongoose/repositories/mongoose-payment.repository';

import { HandlePaymentWebhookUseCase } from '../../../application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';

import { PaymentController } from '../controllers/payment.controller';

import { MercadoPagoProvider } from '../../payments/mercadopago/mercado-pago.provider';

const router: Router = Router();

const orderRepository = new MongooseOrderRepository();
const paymentRepository = new MongoosePaymentRepository();

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
    orderRepository,
    paymentProvider,
  );

const controller = new PaymentController(
  handlePaymentWebhookUseCase,
);

router.post('/webhook', controller.webhook);

export default router;
