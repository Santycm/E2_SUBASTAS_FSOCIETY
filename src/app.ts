import express, { Application } from 'express';

import authRoutes from './infrastructure/http/routes/auth.routes';

const app: Application = express();

app.use(express.json());

app.use('/api/v1/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

export default app;