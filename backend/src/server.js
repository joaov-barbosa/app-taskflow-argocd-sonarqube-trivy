import app from "./app.js";

import config from "./config.js";

import {
  connectRedis,
  isRedisReady,
  closeRedis
} from "./services/redis.js";

async function start() {
  try {
    await connectRedis();

    app.get("/ready", (_req, res) => {
      if (isRedisReady()) {
        return res.json({
          status: "ready"
        });
      }

      res.status(503).json({
        status: "not-ready"
      });
    });

    app.listen(
      config.port,
      "0.0.0.0",
      () => {
        console.log(
          `TaskFlow API listening on ${config.port}`
        );

        console.log(
          `Redis: ${config.redisHost}:${config.redisPort}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start application:",
      error
    );

    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(
    `${signal} received. Shutting down...`
  );

  await closeRedis();

  process.exit(0);
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

start();