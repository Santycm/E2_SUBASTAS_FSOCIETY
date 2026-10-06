import { Router } from 'express';

import { HandlePaymentWebhookUseCase } from '../../../application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';

import { PaymentsController } from '../controllers/payment.controller';

const router: Router = Router();

const handlePaymentWebhookUseCase =
  new HandlePaymentWebhookUseCase();

const controller = new PaymentsController(
  handlePaymentWebhookUseCase,
);

router.post(
  '/webhook',
  controller.handleWebhook,
);

export default router;