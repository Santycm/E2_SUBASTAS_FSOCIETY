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
    await this.handlePaymentWebhookUseCase.execute(req.body);

    res.status(200).json({
      message: 'Payment webhook received successfully',
    });
  };
}