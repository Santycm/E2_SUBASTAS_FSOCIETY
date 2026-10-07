import { Document, Schema, Types, model } from 'mongoose';

import { PaymentStatus } from '../../../../domain/entities/payment';

export interface PaymentDocument extends Document {
  orderId: Types.ObjectId;
  amount: number;
  status: PaymentStatus;
  provider: string;
  externalOrderId: string;
  externalPaymentId: string | null;
  externalEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
      ],
      required: true,
    },

    provider: {
      type: String,
      required: true,
      trim: true,
    },

    externalOrderId: {
      type: String,
      required: true,
      trim: true,
    },

    externalPaymentId: {
      type: String,
      default: null,
      trim: true,
    },

    externalEventId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

paymentSchema.index({
  orderId: 1,
});

paymentSchema.index(
  { externalOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalOrderId: {
        $type: 'string',
      },
    },
  },
);

paymentSchema.index(
  { externalPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalPaymentId: {
        $type: 'string',
      },
    },
  },
);

paymentSchema.index(
  { externalEventId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      externalEventId: {
        $type: 'string',
      },
    },
  },
);

export const PaymentModel = model<PaymentDocument>(
  'Payment',
  paymentSchema,
);