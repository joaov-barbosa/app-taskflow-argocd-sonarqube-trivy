import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "../src/app.jsx";

import {
  getTasks,
  createTask,
  updateTask,
  removeTask
} from "../src/api.js";

vi.mock("../src/api.js", () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  removeTask: vi.fn()
}));

const apiMock = {
  getTasks,
  createTask,
  updateTask,
  removeTask
};

describe("TaskFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar e exibir as tarefas", async () => {
    apiMock.getTasks.mockResolvedValue([
      {
        id: "1",
        title: "Estudar Kubernetes",
        description: "Revisar Deployments",
        status: "TODO"
      }
    ]);

    render(<App />);

    expect(
      await screen.findByText("Estudar Kubernetes")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Revisar Deployments")
    ).toBeInTheDocument();

    const taskElement = screen
      .getByText("Estudar Kubernetes")
      .closest(".task");

    expect(
      taskElement.querySelector(".status")
    ).toHaveTextContent("A fazer");
  });

  it("deve criar uma nova tarefa", async () => {
    const user = userEvent.setup();

    apiMock.getTasks.mockResolvedValue([]);

    apiMock.createTask.mockResolvedValue({
      id: "2",
      title: "Nova tarefa",
      description: "Descrição da tarefa",
      status: "TODO"
    });

    render(<App />);

    await user.type(
      screen.getByPlaceholderText("Título da tarefa"),
      "Nova tarefa"
    );

    await user.type(
      screen.getByPlaceholderText("Descrição"),
      "Descrição da tarefa"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Criar tarefa"
      })
    );

    expect(apiMock.createTask).toHaveBeenCalledWith({
      title: "Nova tarefa",
      description: "Descrição da tarefa",
      status: "TODO"
    });

    const taskElement = await waitFor(() => {
      const title = screen
        .getAllByText("Nova tarefa")
        .find((element) => element.tagName === "H3");

      expect(title).toBeInTheDocument();

      return title.closest(".task");
    });

    expect(taskElement).toBeInTheDocument();

    expect(
      taskElement.querySelector(".status")
    ).toHaveTextContent("A fazer");

    expect(
      screen.getByText("Descrição da tarefa")
    ).toBeInTheDocument();
  });

  it("não deve criar tarefa sem título", async () => {
    const user = userEvent.setup();

    apiMock.getTasks.mockResolvedValue([]);

    render(<App />);

    await user.click(
      screen.getByRole("button", {
        name: "Criar tarefa"
      })
    );

    expect(apiMock.createTask).not.toHaveBeenCalled();
  });

  it("deve avançar o status da tarefa", async () => {
    const user = userEvent.setup();

    const task = {
      id: "3",
      title: "Teste status",
      description: "Alterar status",
      status: "TODO"
    };

    apiMock.getTasks.mockResolvedValue([task]);

    apiMock.updateTask.mockResolvedValue({
      ...task,
      status: "IN_PROGRESS"
    });

    render(<App />);

    const taskTitle = await screen.findByText(
      "Teste status"
    );

    const taskElement = taskTitle.closest(".task");

    expect(taskElement).toBeInTheDocument();

    expect(
      taskElement.querySelector(".status")
    ).toHaveTextContent("A fazer");

    const advanceButton =
      taskElement.querySelector("button");

    await user.click(advanceButton);

    expect(apiMock.updateTask).toHaveBeenCalledWith(
      "3",
      {
        status: "IN_PROGRESS"
      }
    );

    await waitFor(() => {
      expect(
        taskElement.querySelector(".status")
      ).toHaveTextContent("Em andamento");
    });
  });

  it("deve excluir uma tarefa", async () => {
    const user = userEvent.setup();

    apiMock.getTasks.mockResolvedValue([
      {
        id: "4",
        title: "Excluir tarefa",
        description: "Tarefa para excluir",
        status: "TODO"
      }
    ]);

    apiMock.removeTask.mockResolvedValue(null);

    render(<App />);

    const taskTitle = await screen.findByText(
      "Excluir tarefa"
    );

    const taskElement = taskTitle.closest(".task");

    const deleteButton =
      taskElement.querySelector(".danger");

    await user.click(deleteButton);

    expect(apiMock.removeTask).toHaveBeenCalledWith(
      "4"
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Excluir tarefa")
      ).not.toBeInTheDocument();
    });
  });

  it("deve filtrar tarefas por status", async () => {
    const user = userEvent.setup();

    apiMock.getTasks.mockResolvedValue([
      {
        id: "5",
        title: "Tarefa a fazer",
        description: "",
        status: "TODO"
      },
      {
        id: "6",
        title: "Tarefa em andamento",
        description: "",
        status: "IN_PROGRESS"
      },
      {
        id: "7",
        title: "Tarefa concluída",
        description: "",
        status: "DONE"
      }
    ]);

    render(<App />);

    expect(
      await screen.findByText("Tarefa a fazer")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Tarefa em andamento")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Tarefa concluída")
    ).toBeInTheDocument();

    const select = screen.getByRole("combobox");

    await user.selectOptions(select, "DONE");

    expect(
      screen.getByText("Tarefa concluída")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Tarefa a fazer")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Tarefa em andamento")
    ).not.toBeInTheDocument();
  });

  it("deve mostrar erro quando o carregamento falhar", async () => {
    apiMock.getTasks.mockRejectedValue(
      new Error("Erro ao carregar tarefas")
    );

    render(<App />);

    expect(
      await screen.findByText(
        "Erro ao carregar tarefas"
      )
    ).toBeInTheDocument();
  });
});