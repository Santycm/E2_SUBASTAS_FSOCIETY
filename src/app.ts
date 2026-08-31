import express, { Application } from 'express';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import categoriesRoutes from './routes/categories';
import auctionsRoutes from './routes/auctions';
import ordersRoutes from './routes/orders';
import paymentsRoutes from './routes/payments';

const app: Application = express();

const PORT:Number = 3000;

app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/auctions', auctionsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/payments', paymentsRoutes);

// Respuesta para rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});