import 'dotenv/config';

import app from './app';
import { connectMongoDB } from './infrastructure/persistence/mongoose/connection';

const PORT = Number(process.env.PORT) || 3000;

const bootstrap = async (): Promise<void> => {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
};

bootstrap();