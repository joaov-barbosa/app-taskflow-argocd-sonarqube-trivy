import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/services/redis.js", () => ({
  getTasks: vi.fn(),
  getTask: vi.fn(),
  saveTask: vi.fn(),
  deleteTask: vi.fn()
}));

import app from "../src/app.js";

import {
  getTasks,
  getTask,
  saveTask,
  deleteTask
} from "../src/services/redis.js";

describe("Tasks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/tasks", () => {
    it("deve retornar todas as tarefas", async () => {
      const tasks = [
        {
          id: "1",
          title: "Estudar Kubernetes",
          description: "Estudar Services",
          status: "TODO",
          createdAt: 1000
        }
      ];

      getTasks.mockResolvedValue(tasks);

      const response = await request(app)
        .get("/api/tasks");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(tasks);
      expect(getTasks).toHaveBeenCalledOnce();
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("deve retornar uma tarefa existente", async () => {
      const task = {
        id: "123",
        title: "Estudar Redis",
        description: "Estudar Redis",
        status: "TODO",
        createdAt: 1000
      };

      getTask.mockResolvedValue(task);

      const response = await request(app)
        .get("/api/tasks/123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(task);
      expect(getTask).toHaveBeenCalledWith("123");
    });

    it("deve retornar 404 quando a tarefa não existir", async () => {
      getTask.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/tasks/999");

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        error: "Task not found"
      });
    });
  });

  describe("POST /api/tasks", () => {
    it("deve criar uma tarefa", async () => {
      const savedTask = {
        id: "abc-123",
        title: "Estudar Docker",
        description: "Estudar Docker Compose",
        status: "TODO",
        createdAt: 1000
      };

      saveTask.mockImplementation(
        async (task) => ({
          ...task,
          id: savedTask.id,
          createdAt: savedTask.createdAt
        })
      );

      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: "  Estudar Docker  ",
          description: "  Estudar Docker Compose  ",
          status: "TODO"
        });

      expect(response.status).toBe(201);

      expect(response.body.title)
        .toBe("Estudar Docker");

      expect(response.body.description)
        .toBe("Estudar Docker Compose");

      expect(response.body.status)
        .toBe("TODO");

      expect(response.body.id)
        .toBe(savedTask.id);

      expect(saveTask).toHaveBeenCalledOnce();
    });

    it("deve rejeitar tarefa sem título", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          description: "Sem título"
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error: "Title is required"
      });

      expect(saveTask).not.toHaveBeenCalled();
    });

    it("deve rejeitar status inválido", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: "Tarefa inválida",
          status: "INVALID"
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error: "Invalid status"
      });

      expect(saveTask).not.toHaveBeenCalled();
    });

    it("deve usar TODO como status padrão", async () => {
      saveTask.mockImplementation(
        async (task) => task
      );

      const response = await request(app)
        .post("/api/tasks")
        .send({
          title: "Tarefa padrão"
        });

      expect(response.status).toBe(201);
      expect(response.body.status)
        .toBe("TODO");
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("deve atualizar uma tarefa existente", async () => {
      const existingTask = {
        id: "123",
        title: "Título antigo",
        description: "Descrição antiga",
        status: "TODO",
        createdAt: 1000
      };

      const updatedTask = {
        ...existingTask,
        title: "Título novo",
        status: "IN_PROGRESS"
      };

      getTask.mockResolvedValue(existingTask);
      saveTask.mockResolvedValue(updatedTask);

      const response = await request(app)
        .put("/api/tasks/123")
        .send({
          title: "  Título novo  ",
          status: "IN_PROGRESS"
        });

      expect(response.status).toBe(200);

      expect(response.body).toEqual(updatedTask);

      expect(saveTask).toHaveBeenCalledWith({
        ...existingTask,
        title: "Título novo",
        description: "Descrição antiga",
        status: "IN_PROGRESS"
      });
    });

    it("deve retornar 404 quando a tarefa não existir", async () => {
      getTask.mockResolvedValue(null);

      const response = await request(app)
        .put("/api/tasks/999")
        .send({
          title: "Nova tarefa"
        });

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        error: "Task not found"
      });

      expect(saveTask).not.toHaveBeenCalled();
    });

    it("deve rejeitar título vazio", async () => {
      getTask.mockResolvedValue({
        id: "123",
        title: "Título",
        description: "",
        status: "TODO",
        createdAt: 1000
      });

      const response = await request(app)
        .put("/api/tasks/123")
        .send({
          title: "   "
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error: "Title cannot be empty"
      });

      expect(saveTask).not.toHaveBeenCalled();
    });

    it("deve rejeitar status inválido", async () => {
      getTask.mockResolvedValue({
        id: "123",
        title: "Título",
        description: "",
        status: "TODO",
        createdAt: 1000
      });

      const response = await request(app)
        .put("/api/tasks/123")
        .send({
          status: "INVALID"
        });

      expect(response.status).toBe(400);

      expect(response.body).toEqual({
        error: "Invalid status"
      });

      expect(saveTask).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("deve excluir uma tarefa existente", async () => {
      deleteTask.mockResolvedValue(1);

      const response = await request(app)
        .delete("/api/tasks/123");

      expect(response.status).toBe(204);

      expect(deleteTask)
        .toHaveBeenCalledWith("123");
    });

    it("deve retornar 404 quando a tarefa não existir", async () => {
      deleteTask.mockResolvedValue(0);

      const response = await request(app)
        .delete("/api/tasks/999");

      expect(response.status).toBe(404);

      expect(response.body).toEqual({
        error: "Task not found"
      });
    });
  });
});