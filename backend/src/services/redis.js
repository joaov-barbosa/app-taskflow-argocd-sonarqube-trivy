import { createClient } from "redis";
import config from "../config.js";

const redis = createClient({
  socket: {
    host: config.redisHost,
    port: config.redisPort
  },
  password: config.redisPassword
});

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export function isRedisReady() {
  return redis.isReady;
}

export async function getTasks() {
  const keys = await redis.keys("task:*");

  const tasks = [];

  for (const key of keys) {
    const task = await redis.hGetAll(key);

    if (task.id) {
      tasks.push({
        ...task,
        createdAt: Number(task.createdAt)
      });
    }
  }

  return tasks.sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function getTask(id) {
  const task = await redis.hGetAll(`task:${id}`);

  if (!task.id) {
    return null;
  }

  return {
    ...task,
    createdAt: Number(task.createdAt)
  };
}

export async function saveTask(task) {
  await redis.hSet(`task:${task.id}`, {
    id: task.id,
    title: task.title,
    description: task.description || "",
    status: task.status,
    createdAt: String(task.createdAt)
  });

  return task;
}

export async function deleteTask(id) {
  return redis.del(`task:${id}`);
}

export async function closeRedis() {
  if (redis.isOpen) {
    await redis.quit();
  }
}