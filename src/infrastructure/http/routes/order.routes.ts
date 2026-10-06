import { Router } from 'express';

import { MongooseOrderRepository } from '../../persistence/mongoose/repositories/mongoose-order.repository';
import { GetOrdersUseCase } from '../../../application/use-cases/orders/get-orders/get-orders';
import { GetOrderByIdUseCase } from '../../../application/use-cases/orders/get-order-by-id/get-order-by-id';
import { OrdersController } from '../controllers/order.controller';

const router: Router = Router();

const orderRepository = new MongooseOrderRepository();

const getOrdersUseCase = new GetOrdersUseCase(
  orderRepository,
);

const getOrderByIdUseCase = new GetOrderByIdUseCase(
  orderRepository,
);

const controller = new OrdersController(
  getOrdersUseCase,
  getOrderByIdUseCase,
);

router.get('/', controller.getOrders);
router.get('/:id', controller.getOrder);

export default router;