import { Router } from "express";
import { randomUUID } from "node:crypto";

import {
  getTasks,
  getTask,
  saveTask,
  deleteTask
} from "../services/redis.js";

const router = Router();

const VALID_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "DONE"
];

router.get("/", async (_req, res, next) => {
  try {
    res.json(await getTasks());
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const task = await getTask(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      title,
      description = "",
      status = "TODO"
    } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ error: "Title is required" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: "Invalid status" });
    }

    const task = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      status,
      createdAt: Date.now()
    };

    res
      .status(201)
      .json(await saveTask(task));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await getTask(req.params.id);

    if (!existing) {
      return res
        .status(404)
        .json({ error: "Task not found" });
    }

    const {
      title,
      description,
      status
    } = req.body;

    if (
      title !== undefined &&
      !title.trim()
    ) {
      return res
        .status(400)
        .json({ error: "Title cannot be empty" });
    }

    if (
      status !== undefined &&
      !VALID_STATUSES.includes(status)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid status" });
    }

    const updated = {
      ...existing,

      title:
        title !== undefined
          ? title.trim()
          : existing.title,

      description:
        description !== undefined
          ? description.trim()
          : existing.description,

      status:
        status !== undefined
          ? status
          : existing.status
    };

    res.json(await saveTask(updated));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteTask(
      req.params.id
    );

    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Task not found" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;