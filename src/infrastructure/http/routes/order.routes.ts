import { Router } from 'express';

import { MongooseAuctionRepository } from '../../persistence/mongoose/repositories/mongoose-auction.repository';
import { MongooseOrderRepository } from '../../persistence/mongoose/repositories/mongoose-order.repository';
import { MongoosePaymentRepository } from '../../persistence/mongoose/repositories/mongoose-payment.repository';

import { GetOrdersUseCase } from '../../../application/use-cases/orders/get-orders/get-orders';
import { GetOrderByIdUseCase } from '../../../application/use-cases/orders/get-order-by-id/get-order-by-id';
import { GetSellerOrdersUseCase } from '../../../application/use-cases/orders/get-seller-orders/get-seller-orders';
import { CreatePaymentUseCase } from '../../../application/use-cases/payments/create-payment/create-payment';

import { OrdersController } from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { MercadoPagoProvider } from '../../payments/mercadopago/mercado-pago.provider';

import {
  getOrdersValidator,
  getSellerOrdersValidator,
  orderIdValidator,
} from '../validators/order.validator';

const router: Router = Router();

const orderRepository = new MongooseOrderRepository();
const auctionRepository = new MongooseAuctionRepository();
const paymentRepository = new MongoosePaymentRepository();

const mercadoPagoAccessToken =
  process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!mercadoPagoAccessToken) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN_NOT_CONFIGURED');
}

const paymentProvider = new MercadoPagoProvider(
  mercadoPagoAccessToken,
);

const getOrdersUseCase = new GetOrdersUseCase(
  orderRepository,
);

const getOrderByIdUseCase = new GetOrderByIdUseCase(
  orderRepository,
  auctionRepository,
);

const getSellerOrdersUseCase = new GetSellerOrdersUseCase(
  auctionRepository,
  orderRepository,
);

const createPaymentUseCase = new CreatePaymentUseCase(
  orderRepository,
  auctionRepository,
  paymentRepository,
  paymentProvider,
);

const controller = new OrdersController(
  getOrdersUseCase,
  getOrderByIdUseCase,
  getSellerOrdersUseCase,
  createPaymentUseCase,
);

router.get(
  '/',
  authMiddleware,
  getOrdersValidator,
  validationMiddleware,
  controller.getOrders,
);

router.get(
  '/sales',
  authMiddleware,
  getSellerOrdersValidator,
  validationMiddleware,
  controller.getSellerOrders,
);

router.post(
  '/:id/payment',
  authMiddleware,
  orderIdValidator,
  validationMiddleware,
  controller.createPayment,
);

router.get(
  '/:id',
  authMiddleware,
  orderIdValidator,
  validationMiddleware,
  controller.getOrder,
);

export default router;