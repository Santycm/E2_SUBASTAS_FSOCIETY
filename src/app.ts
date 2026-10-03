import express, { Application } from 'express';

import authRoutes from './infrastructure/http/routes/auth.routes';
import categoriesRoutes from './infrastructure/http/routes/category.routes';
import auctionsRoutes from './infrastructure/http/routes/auction.routes';
import ordersRoutes from './infrastructure/http/routes/order.routes';
import usersRoutes from './infrastructure/http/routes/user.routes';

const app: Application = express();

app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/auctions', auctionsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/users', usersRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

export default app;