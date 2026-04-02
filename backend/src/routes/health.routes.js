import { Router } from "express";
import { isFirebaseAuthConfigured } from "../config/firebase-admin.js";
import { asyncHandler } from "../utils/async-handler.js";
import { testDatabaseConnection } from "../config/db.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    let database = "connected";
    let databaseName = null;
    let serverTime = null;
    let databaseError = null;

    try {
      const dbStatus = await testDatabaseConnection(1500);
      databaseName = dbStatus.database_name;
      serverTime = dbStatus.now;
    } catch (error) {
      database = "unavailable";
      databaseError = error?.message || "Database connection failed.";
    }

    res.json({
      status: "ok",
      service: "bips-hub-backend",
      database,
      databaseName,
      serverTime,
      databaseError,
      authConfigured: isFirebaseAuthConfigured(),
    });
  })
);

export default router;
