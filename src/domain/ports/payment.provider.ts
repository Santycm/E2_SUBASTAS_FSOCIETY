export interface CreateExternalPaymentInput {
  orderId: string;
  amount: number;
  title: string;
}

export interface CreateExternalPaymentResult {
  id: string;
  checkoutUrl: string;
}

export interface ExternalPayment {
  id: string;
  status: string;
  amount: number;
  orderId: string | null;
}

export interface PaymentProvider {
  createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult>;

  getPayment(paymentId: string): Promise<ExternalPayment>;
}