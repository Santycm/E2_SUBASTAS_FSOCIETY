import { ErrorRequestHandler } from "express";

import { ApplicationError } from "../../../application/errors/application-error";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApplicationError) {
    res.status(error.statusCode).json({
      message: error.code,
    });
    return;
  }

  if (
    error instanceof SyntaxError &&
    "body" in error
  ) {
    res.status(400).json({
      message: "INVALID_JSON",
    });
    return;
  }

  console.error("[HTTP] INTERNAL_SERVER_ERROR:", error);

  res.status(500).json({
    message: "INTERNAL_SERVER_ERROR",
  });
};
