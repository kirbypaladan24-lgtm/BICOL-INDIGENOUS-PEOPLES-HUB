import { ApiError } from "../utils/api-error.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `No backend route matched ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
}

export function errorHandler(error, req, res, next) {
  const status = normalizeStatus(error);
  const payload = {
    error: status >= 500 ? "Server Error" : "Request Error",
    message: normalizeMessage(error, status),
    requestId: req.requestId,
  };

  if (error instanceof ApiError && error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && error.stack) {
    payload.stack = error.stack;
  }

  console.error(`[API] ${req.method} ${req.originalUrl}`, error);
  res.status(status).json(payload);
}

function normalizeStatus(error) {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  switch (error?.code) {
    case "23505":
      return 409;
    case "22P02":
    case "23502":
    case "23503":
    case "23514":
      return 400;
    default:
      return error?.statusCode || 500;
  }
}

function normalizeMessage(error, status) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (status === 409) {
    return "This request conflicts with existing data.";
  }

  if (status === 400) {
    return "The request data is invalid.";
  }

  return error?.message || "Something went wrong.";
}
