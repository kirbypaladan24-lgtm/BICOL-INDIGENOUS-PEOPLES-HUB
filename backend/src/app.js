import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import usersRoutes from "./routes/users.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import landmarksRoutes from "./routes/landmarks.routes.js";
import sharedLocationsRoutes from "./routes/shared-locations.routes.js";
import emergencyAlertsRoutes from "./routes/emergency-alerts.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import syncRoutes from "./routes/sync.routes.js";
import { attachRequestContext } from "./middleware/request-context.js";
import { createRateLimiter } from "./middleware/rate-limit.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();
  const apiLimiter = createRateLimiter({
    name: "api",
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    message: "Too many API requests. Please wait and try again.",
  });

  app.set("trust proxy", env.trustProxy ? 1 : false);
  app.use(attachRequestContext);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || !env.corsOrigins.length || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/api", apiLimiter);

  app.get("/", (req, res) => {
    res.json({
      service: "bips-hub-backend",
      message: "Backend is running. Frontend integration has not been connected yet.",
    });
  });

  app.use("/health", healthRoutes);
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);
  app.use("/api/v1/users", usersRoutes);
  app.use("/api/v1/posts", postsRoutes);
  app.use("/api/v1/landmarks", landmarksRoutes);
  app.use("/api/v1/shared-locations", sharedLocationsRoutes);
  app.use("/api/v1/emergency-alerts", emergencyAlertsRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/sync", syncRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
