import dotenv from 'dotenv';

dotenv.config({
  path: '.env.test',
  quiet: true,
});

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('[Tests] MONGODB_URI is not defined in .env.test');
}

const databaseName = new URL(mongoUri).pathname.replace(/^\/+/, '').split('?')[0];

if (databaseName !== 'e2_subastas_test') {
  throw new Error(
    `[Tests] Expected database "e2_subastas_test", received "${databaseName || '(empty)'}"`,
  );
}
