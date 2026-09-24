import {
  describe,
  it,
  expect,
  beforeEach,
  vi
} from "vitest";

const { redisMock } = vi.hoisted(() => {
  return {
    redisMock: {
      isOpen: false,
      isReady: false,

      connect: vi.fn(),
      quit: vi.fn(),
      keys: vi.fn(),
      hGetAll: vi.fn(),
      hSet: vi.fn(),
      del: vi.fn(),
      on: vi.fn()
    }
  };
});

vi.mock("redis", () => ({
  createClient: vi.fn(() => redisMock)
}));

import {
  connectRedis,
  isRedisReady,
  getTasks,
  getTask,
  saveTask,
  deleteTask,
  closeRedis
} from "../src/services/redis.js";

describe("Redis service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    redisMock.isOpen = false;
    redisMock.isReady = false;
  });

  describe("connectRedis", () => {
    it("deve conectar quando o Redis estiver fechado", async () => {
      redisMock.isOpen = false;

      redisMock.connect.mockImplementation(async () => {
        redisMock.isOpen = true;
        redisMock.isReady = true;
      });

      await connectRedis();

      expect(redisMock.connect)
        .toHaveBeenCalledOnce();
    });

    it("não deve conectar novamente se já estiver aberto", async () => {
      redisMock.isOpen = true;

      await connectRedis();

      expect(redisMock.connect)
        .not.toHaveBeenCalled();
    });
  });

  describe("isRedisReady", () => {
    it("deve retornar o estado do Redis", () => {
      redisMock.isReady = true;

      expect(isRedisReady()).toBe(true);

      redisMock.isReady = false;

      expect(isRedisReady()).toBe(false);
    });
  });

  describe("getTasks", () => {
    it("deve buscar e ordenar as tarefas", async () => {
      redisMock.keys.mockResolvedValue([
        "task:1",
        "task:2"
      ]);

      redisMock.hGetAll
        .mockResolvedValueOnce({
          id: "1",
          title: "Tarefa antiga",
          description: "",
          status: "TODO",
          createdAt: "1000"
        })
        .mockResolvedValueOnce({
          id: "2",
          title: "Tarefa nova",
          description: "",
          status: "DONE",
          createdAt: "2000"
        });

      const tasks = await getTasks();

      expect(redisMock.keys)
        .toHaveBeenCalledWith("task:*");

      expect(tasks).toHaveLength(2);

      expect(tasks[0].id).toBe("2");
      expect(tasks[1].id).toBe("1");

      expect(tasks[0].createdAt)
        .toBe(2000);

      expect(tasks[1].createdAt)
        .toBe(1000);
    });

    it("deve ignorar registros sem id", async () => {
      redisMock.keys.mockResolvedValue([
        "task:1",
        "task:invalid"
      ]);

      redisMock.hGetAll
        .mockResolvedValueOnce({
          id: "1",
          title: "Tarefa válida",
          status: "TODO",
          createdAt: "1000"
        })
        .mockResolvedValueOnce({});

      const tasks = await getTasks();

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe("1");
    });
  });

  describe("getTask", () => {
    it("deve retornar uma tarefa existente", async () => {
      redisMock.hGetAll.mockResolvedValue({
        id: "123",
        title: "Estudar Redis",
        description: "Laboratório",
        status: "TODO",
        createdAt: "1000"
      });

      const task = await getTask("123");

      expect(redisMock.hGetAll)
        .toHaveBeenCalledWith("task:123");

      expect(task).toEqual({
        id: "123",
        title: "Estudar Redis",
        description: "Laboratório",
        status: "TODO",
        createdAt: 1000
      });
    });

    it("deve retornar null quando a tarefa não existir", async () => {
      redisMock.hGetAll.mockResolvedValue({});

      const task = await getTask("999");

      expect(task).toBeNull();
    });
  });

  describe("saveTask", () => {
    it("deve salvar uma tarefa como hash", async () => {
      const task = {
        id: "123",
        title: "Estudar Kubernetes",
        description: "Estudar Services",
        status: "TODO",
        createdAt: 1000
      };

      redisMock.hSet.mockResolvedValue(5);

      const result = await saveTask(task);

      expect(redisMock.hSet)
        .toHaveBeenCalledWith(
          "task:123",
          {
            id: "123",
            title: "Estudar Kubernetes",
            description: "Estudar Services",
            status: "TODO",
            createdAt: "1000"
          }
        );

      expect(result).toEqual(task);
    });
  });

  describe("deleteTask", () => {
    it("deve excluir a tarefa pelo id", async () => {
      redisMock.del.mockResolvedValue(1);

      const result = await deleteTask("123");

      expect(redisMock.del)
        .toHaveBeenCalledWith("task:123");

      expect(result).toBe(1);
    });
  });

  describe("closeRedis", () => {
    it("deve fechar o Redis quando estiver aberto", async () => {
      redisMock.isOpen = true;

      await closeRedis();

      expect(redisMock.quit)
        .toHaveBeenCalledOnce();
    });

    it("não deve fechar o Redis quando estiver fechado", async () => {
      redisMock.isOpen = false;

      await closeRedis();

      expect(redisMock.quit)
        .not.toHaveBeenCalled();
    });
  });
});