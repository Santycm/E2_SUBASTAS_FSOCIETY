export const ORDER_PAYMENT_DURATION_MS =
  48 * 60 * 60 * 1000;

export function calculateOrderExpiration(
  createdAt: Date,
): Date {
  return new Date(
    createdAt.getTime() + ORDER_PAYMENT_DURATION_MS,
  );
}