export interface HandlePaymentWebhookDto {
  eventId?: string;
  paymentId?: string;
  status?: string;
  amount?: number;
}