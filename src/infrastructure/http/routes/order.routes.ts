import { Router } from 'express';

import { MongooseAuctionRepository } from '../../persistence/mongoose/repositories/mongoose-auction.repository';
import { MongooseOrderRepository } from '../../persistence/mongoose/repositories/mongoose-order.repository';

import { GetOrdersUseCase } from '../../../application/use-cases/orders/get-orders/get-orders';
import { GetOrderByIdUseCase } from '../../../application/use-cases/orders/get-order-by-id/get-order-by-id';
import { GetSellerOrdersUseCase } from '../../../application/use-cases/orders/get-seller-orders/get-seller-orders';

import { OrdersController } from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

const orderRepository = new MongooseOrderRepository();
const auctionRepository = new MongooseAuctionRepository();

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

const controller = new OrdersController(
  getOrdersUseCase,
  getOrderByIdUseCase,
  getSellerOrdersUseCase,
);

router.get(
  '/',
  authMiddleware,
  controller.getOrders,
);

router.get(
  '/sales',
  authMiddleware,
  controller.getSellerOrders,
);

router.get(
  '/:id',
  authMiddleware,
  controller.getOrder,
);

export default router;