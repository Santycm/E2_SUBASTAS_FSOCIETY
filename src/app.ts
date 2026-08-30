import express, { Application } from 'express';

const app:Application = express();

const PORT = 3000;

app.get('/', (_req, res) => {
  res.json({
    message: 'E2 Subastas FSOCIETY API funcionando correctamente',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});