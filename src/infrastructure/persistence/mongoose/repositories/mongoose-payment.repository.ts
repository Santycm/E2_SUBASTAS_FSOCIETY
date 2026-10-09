import { Types } from 'mongoose';

import { Payment } from '../../../../domain/entities/payment';
import {
  CreatePaymentData,
  PaymentRepository,
} from '../../../../domain/ports/payment.repository';

import {
  PaymentDocument,
  PaymentModel,
} from '../models/payment.model';

import { ApplicationError } from '../../../../application/errors/application-error';

export class MongoosePaymentRepository implements PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const payment = await PaymentModel.findById(id).lean();

    if (!payment) {
      return null;
    }

    return this.toDomain(payment);
  }

  async findByOrderId(
    orderId: string,
  ): Promise<Payment | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }

    const payment = await PaymentModel.findOne({
      orderId,
    }).lean();

    if (!payment) {
      return null;
    }

    return this.toDomain(payment);
  }

  async findByExternalOrderId(
    externalOrderId: string,
  ): Promise<Payment | null> {
    const payment = await PaymentModel.findOne({
      externalOrderId,
    }).lean();

    if (!payment) {
      return null;
    }

    return this.toDomain(payment);
  }

  async findByExternalEventId(
    externalEventId: string,
  ): Promise<Payment | null> {
    const payment = await PaymentModel.findOne({
      externalEventId,
    }).lean();

    if (!payment) {
      return null;
    }

    return this.toDomain(payment);
  }

  async save(data: CreatePaymentData): Promise<Payment> {
    const savedPayment = await PaymentModel.create(data);

    return this.toDomain(savedPayment.toObject());
  }

  async update(payment: Payment): Promise<Payment> {
    if (!Types.ObjectId.isValid(payment.id)) {
      throw new ApplicationError('INVALID_PAYMENT_ID', 400);
    }

    const updatedPayment = await PaymentModel.findByIdAndUpdate(
      payment.id,
      {
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider,
        externalOrderId: payment.externalOrderId,
        externalPaymentId: payment.externalPaymentId,
        externalEventId: payment.externalEventId,
        updatedAt: payment.updatedAt,
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    ).lean();

    if (!updatedPayment) {
      throw new ApplicationError('PAYMENT_NOT_FOUND', 404);
    }

    return this.toDomain(updatedPayment);
  }

  private toDomain(payment: PaymentDocument): Payment {
    return {
      id: payment._id.toString(),
      orderId: payment.orderId.toString(),
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider,
      externalOrderId: payment.externalOrderId,
      externalPaymentId: payment.externalPaymentId,
      externalEventId: payment.externalEventId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}