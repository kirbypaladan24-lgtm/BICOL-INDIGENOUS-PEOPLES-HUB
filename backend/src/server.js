import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { pool, testDatabaseConnection } from "./config/db.js";

const app = createApp();
let server = null;

async function startServer() {
  server = app.listen(env.port, () => {
    console.log(`[Backend] BIPs Hub backend running on port ${env.port}`);
  });

  testDatabaseConnection(3000)
    .then((dbStatus) => {
      console.log(
        `[Backend] PostgreSQL connected to ${dbStatus.database_name} at ${dbStatus.now}`
      );
    })
    .catch((error) => {
      console.error(
        "[Backend] PostgreSQL is not reachable yet. The server will stay up, but database-backed routes may fail until the connection is corrected.",
        error
      );
    });
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
