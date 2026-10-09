import { Application } from 'express';

import authRoutes from './auth.routes';
import categoriesRoutes from './category.routes';
import auctionsRoutes from './auction.routes';
import ordersRoutes from './order.routes';
import usersRoutes from './user.routes';
import paymentsRoutes from './payment.routes';

import { AuctionEventPublisher } from '../../../domain/ports/auction-event.publisher';
import { notFoundMiddleware } from '../middlewares/not-found.middleware';
import { errorMiddleware } from '../middlewares/error.middleware';

export const registerRoutes = (
  app: Application,
  auctionEventPublisher: AuctionEventPublisher,
): void => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/categories', categoriesRoutes);
  app.use(
    '/api/v1/auctions',
    auctionsRoutes(auctionEventPublisher),
  );
  app.use('/api/v1/orders', ordersRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/payments', paymentsRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
};