import { Request, Response } from 'express';
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from 'mercadopago';

import { HandlePaymentWebhookUseCase } from '../../../application/use-cases/payments/handle-payment-webhook/handle-payment-webhook';

export class PaymentController {
  constructor(
    private readonly handlePaymentWebhookUseCase: HandlePaymentWebhookUseCase,
    private readonly webhookSecret: string,
    private readonly allowUnverifiedWebhookReconciliation = false,
  ) {}

  webhook = async (req: Request, res: Response): Promise<void> => {
    const externalOrderId = req.query['data.id'];
    const eventId = req.header('x-request-id');
    const signature = req.header('x-signature');

    const applicationId = req.body?.application_id ?? null;

    console.info('[PaymentWebhook] Notification received', {
      applicationId,
      externalOrderId:
        typeof externalOrderId === 'string' ? externalOrderId : null,
      eventId: eventId ?? null,
      signaturePresent: Boolean(signature),
    });

    if (
      typeof externalOrderId !== 'string' ||
      !externalOrderId.trim()
    ) {
      res.status(400).json({ error: 'MISSING_EXTERNAL_ORDER_ID' });
      return;
    }

    if (!eventId) {
      res.status(400).json({ error: 'MISSING_EVENT_ID' });
      return;
    }

    let signatureValid = false;

    if (signature && this.webhookSecret) {
      try {
        WebhookSignatureValidator.validate({
          xSignature: signature,
          xRequestId: eventId,
          dataId: externalOrderId,
          secret: this.webhookSecret,
          toleranceSeconds: 300,
        });

        signatureValid = true;
      } catch (error) {
        if (!(error instanceof InvalidWebhookSignatureError)) {
          console.error('[PaymentWebhook] Signature validation error', {
            errorName:
              error instanceof Error ? error.name : 'UnknownError',
          });

          res.status(500).json({
            error: 'SIGNATURE_VALIDATION_ERROR',
          });
          return;
        }
      }
    }

    if (signatureValid) {
      console.info('[PaymentWebhook] Signature validated', {
        externalOrderId,
        eventId,
      });
    } else {
      console.warn('[PaymentWebhook] Signature not validated', {
        applicationId,
        externalOrderId,
        eventId,
        reconciliationEnabled:
          this.allowUnverifiedWebhookReconciliation,
      });

      if (!this.allowUnverifiedWebhookReconciliation) {
        res.status(401).json({ error: 'INVALID_SIGNATURE' });
        return;
      }

      console.warn(
        '[PaymentWebhook] Continuing in demonstration reconciliation mode',
        { externalOrderId, eventId },
      );
    }

    try {
      await this.handlePaymentWebhookUseCase.execute({
        externalOrderId,
        eventId,
      });

      console.info('[PaymentWebhook] Payment reconciliation completed', {
        externalOrderId,
        eventId,
        signatureValid,
      });

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('[PaymentWebhook] Payment reconciliation failed', {
        externalOrderId,
        eventId,
        errorName:
          error instanceof Error ? error.name : 'UnknownError',
        errorMessage:
          error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        error: 'WEBHOOK_PROCESSING_FAILED',
      });
    }
  };
}