import { Request, Response } from 'express';

import { HandlePaymentWebhookUseCase } from '../../../application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';

export class PaymentsController {
  constructor(
    private readonly handlePaymentWebhookUseCase: HandlePaymentWebhookUseCase,
  ) {}

  handleWebhook = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    await this.handlePaymentWebhookUseCase.execute({
      eventId: req.body.eventId,
      paymentId: req.body.paymentId,
      status: req.body.status,
      amount: req.body.amount,
    });

    res.status(200).json({
      received: true,
    });
  };
}