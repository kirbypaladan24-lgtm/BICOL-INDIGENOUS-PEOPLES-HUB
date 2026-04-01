import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool, testDatabaseConnection } from "./config/db.js";

const app = createApp();
let server = null;

async function startServer() {
  try {
    const dbStatus = await testDatabaseConnection();
    console.log(
      `[Backend] PostgreSQL connected to ${dbStatus.database_name} at ${dbStatus.now}`
    );

    server = app.listen(env.port, () => {
      console.log(`[Backend] BIPs Hub backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error("[Backend] Failed to start server:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`[Backend] Received ${signal}. Shutting down cleanly...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("[Backend] Shutdown failed:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("[Backend] Unhandled promise rejection:", error);
});
process.on("uncaughtException", (error) => {
  console.error("[Backend] Uncaught exception:", error);
  shutdown("uncaughtException");
});

startServer();
