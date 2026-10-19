import express, { Application } from "express";

import { swaggerRouter } from "./infrastructure/http/docs/swagger";

const app: Application = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api-docs", swaggerRouter);

export default app;
