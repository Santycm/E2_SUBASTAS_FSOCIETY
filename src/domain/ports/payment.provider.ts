export interface CreateExternalPaymentInput {
  orderId: string;
  amount: number;
  title: string;
  description: string;
  categoryId: string;
}

export interface CreateExternalPaymentResult {
  externalOrderId: string;
  checkoutUrl: string;
}

export interface ExternalPayment {
  id: string;
  externalOrderId: string;
  status: string;
  amount: number;
  orderId: string | null;
}

export interface PaymentProvider {
  createPayment(
    input: CreateExternalPaymentInput,
  ): Promise<CreateExternalPaymentResult>;

  getPayment(
    externalOrderId: string,
  ): Promise<ExternalPayment>;
}