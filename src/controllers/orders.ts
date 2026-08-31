import { Request, Response } from "express";
import { orders } from "../data/orders";

export const getOrders = (_req: Request, res: Response): void => {
  res.status(200).json({
    data: orders,
  });
};

export const getOrder = (req: Request, res: Response): void => {
  const { id } = req.params;

  const order = orders.find((order) => order.id === id);

  if (!order) {
    res.status(404).json({
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found",
      },
    });

    return;
  }

  res.status(200).json({
    data: order,
  });
};
