import mongoose, { Types } from "mongoose";

import { ApplicationError } from "../../../../application/errors/application-error";
import {
  PaymentSettlementRepository,
  SettlePaymentInput,
} from "../../../../domain/ports/payment-settlement.repository";
import { PaymentModel } from "../models/payment.model";
import { OrderModel } from "../models/order.model";

export class MongoosePaymentSettlementRepository implements PaymentSettlementRepository {
  async settle(input: SettlePaymentInput): Promise<void> {
    if (
      !Types.ObjectId.isValid(input.paymentId) ||
      !Types.ObjectId.isValid(input.orderId)
    ) {
      throw new ApplicationError("INVALID_PAYMENT_OR_ORDER_ID", 400);
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const payment = await PaymentModel.findById(input.paymentId)
          .session(session)
          .lean();

        if (!payment) {
          throw new ApplicationError("PAYMENT_NOT_FOUND", 404);
        }

        if (payment.orderId.toString() !== input.orderId) {
          throw new ApplicationError("PAYMENT_ORDER_MISMATCH", 400);
        }

        if (payment.status === "APPROVED") {
          const order = await OrderModel.findById(input.orderId)
            .session(session)
            .lean();

          if (order?.status !== "PAID") {
            throw new ApplicationError("PAYMENT_ORDER_STATE_INCONSISTENT", 409);
          }

          return;
        }

        if (payment.status !== "PENDING") {
          return;
        }

        const updatedPayment = await PaymentModel.updateOne(
          {
            _id: input.paymentId,
            status: "PENDING",
          },
          {
            $set: {
              status: input.status,
              externalPaymentId: input.externalPaymentId,
              externalEventId: input.externalEventId,
              updatedAt: input.updatedAt,
            },
          },
          {
            session,
            timestamps: false,
          },
        );

        if (updatedPayment.modifiedCount !== 1) {
          throw new ApplicationError("PAYMENT_STATE_CHANGED", 409);
        }

        if (input.status === "APPROVED") {
          const updatedOrder = await OrderModel.updateOne(
            {
              _id: input.orderId,
              status: "PENDING",
            },
            {
              $set: {
                status: "PAID",
              },
            },
            { session },
          );

          if (updatedOrder.modifiedCount !== 1) {
            const order = await OrderModel.findById(input.orderId)
              .session(session)
              .lean();

            if (order?.status !== "PAID") {
              throw new ApplicationError("ORDER_CANNOT_BE_MARKED_AS_PAID", 409);
            }
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }
}
