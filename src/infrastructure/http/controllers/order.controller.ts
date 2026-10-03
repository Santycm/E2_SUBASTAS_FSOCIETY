import { Request, Response } from 'express';

import { GetOrdersUseCase } from '../../../application/use-cases/orders/get-orders/get-orders';
import { GetOrderByIdUseCase } from '../../../application/use-cases/orders/get-order-by-id/get-order-by-id';

export class OrdersController {
  constructor(
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
  ) {}

  getOrders = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const orders = await this.getOrdersUseCase.execute();

    res.json(orders);
  };

  getOrder = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const order = await this.getOrderByIdUseCase.execute(
      req.params.id.toString(),
    );

    if (!order) {
      res.status(404).json({
        message: 'ORDER_NOT_FOUND',
      });

      return;
    }

    res.json(order);
  };
}