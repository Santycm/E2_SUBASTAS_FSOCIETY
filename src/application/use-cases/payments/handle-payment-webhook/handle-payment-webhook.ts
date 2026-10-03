export interface HandlePaymentWebhookInput {
  eventId?: string;
  paymentId?: string;
  status?: string;
  amount?: number;
}

export class HandlePaymentWebhookUseCase {
  async execute(
    _input: HandlePaymentWebhookInput,
  ): Promise<void> {
    return;
  }
}