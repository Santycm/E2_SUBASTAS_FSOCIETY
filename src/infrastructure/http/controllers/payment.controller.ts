import { Request, Response } from "express";

import { HandlePaymentWebhookUseCase } from "../../../application/use-cases/payments/handle-payment-webhook/handle-payment-webhook";

export class PaymentController {
  constructor(
    private readonly handlePaymentWebhookUseCase: HandlePaymentWebhookUseCase,
  ) {}

  webhook = async (req: Request, res: Response): Promise<void> => {
    const externalOrderId = req.query["data.id"];
    const eventId = req.header("x-request-id");

    console.log(
      `[PaymentWebhook] Mercado Pago webhook received | order=${externalOrderId} | event=${eventId}`,
    );

    if (typeof externalOrderId !== "string") {
      res.status(400).json({
        error: "MISSING_EXTERNAL_ORDER_ID",
      });
      return;
    }

    if (!eventId) {
      res.status(400).json({
        error: "MISSING_EVENT_ID",
      });
      return;
    }

    await this.handlePaymentWebhookUseCase.execute({
      externalOrderId,
      eventId,
    });

    console.log(
      `[PaymentWebhook] Payment processed successfully | order=${externalOrderId} | event=${eventId}`,
    );

    res.status(200).json({
      received: true,
    });
  };
}
