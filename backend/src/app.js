import express from "express";
import cors from "cors";

import tasksRouter from "./routes/tasks.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});

app.get("/api/info", (_req, res) => {
  res.json({
    application: "taskflow",
    version:
      process.env.APP_VERSION || "1.0.0",
    environment:
      process.env.NODE_ENV || "development"
  });
});

app.use(
  "/api/tasks",
  tasksRouter
);

app.use(
  (error, _req, res, _next) => {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
);

export default app;