import 'dotenv/config';

import app from './app';
import { connectMongoDB } from './infrastructure/persistence/mongoose/connection';

const PORT = Number(process.env.PORT) || 3000;

const bootstrap = async (): Promise<void> => {
  await connectMongoDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on port ${PORT}`);
  });
};

bootstrap();