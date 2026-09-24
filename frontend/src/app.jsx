import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  createTask,
  getTasks,
  removeTask,
  updateTask
} from "./api.js";

const STATUS_LABELS = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída"
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      setError("");

      const data = await getTasks();

      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    try {
      const task = await createTask({
        title,
        description,
        status: "TODO"
      });

      setTasks((current) => [
        task,
        ...current
      ]);

      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(task) {
    const nextStatus =
      task.status === "TODO"
        ? "IN_PROGRESS"
        : task.status === "IN_PROGRESS"
          ? "DONE"
          : "TODO";

    try {
      const updated = await updateTask(
        task.id,
        {
          status: nextStatus
        }
      );

      setTasks((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await removeTask(id);

      setTasks((current) =>
        current.filter(
          (task) => task.id !== id
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredTasks = useMemo(
    () =>
      filter === "ALL"
        ? tasks
        : tasks.filter(
            (task) =>
              task.status === filter
          ),
    [tasks, filter]
  );

  const counts = {
    total: tasks.length,

    todo: tasks.filter(
      (task) =>
        task.status === "TODO"
    ).length,

    progress: tasks.filter(
      (task) =>
        task.status === "IN_PROGRESS"
    ).length,

    done: tasks.filter(
      (task) =>
        task.status === "DONE"
    ).length
  };

  return (
    <main className="container">

      <header>

        <p className="eyebrow">
          DEVOPS LAB
        </p>

        <h1>
          TaskFlow
        </h1>

        <p className="subtitle">
          Aplicação para laboratório
          de Docker, Kubernetes e CI/CD.
        </p>

      </header>

      <section className="stats">

        <div>
          <strong>
            {counts.total}
          </strong>

          <span>
            Total
          </span>
        </div>

        <div>
          <strong>
            {counts.todo}
          </strong>

          <span>
            A fazer
          </span>
        </div>

        <div>
          <strong>
            {counts.progress}
          </strong>

          <span>
            Em andamento
          </span>
        </div>

        <div>
          <strong>
            {counts.done}
          </strong>

          <span>
            Concluídas
          </span>
        </div>

      </section>

      <section className="card">

        <h2>
          Nova tarefa
        </h2>

        <form onSubmit={handleCreate}>

          <input
            placeholder="Título da tarefa"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
          />

          <textarea
            placeholder="Descrição"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
          />

          <button type="submit">
            Criar tarefa
          </button>

        </form>

      </section>

      <section className="toolbar">

        <h2>
          Tarefas
        </h2>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(
              event.target.value
            )
          }
        >

          <option value="ALL">
            Todas
          </option>

          <option value="TODO">
            A fazer
          </option>

          <option value="IN_PROGRESS">
            Em andamento
          </option>

          <option value="DONE">
            Concluídas
          </option>

        </select>

      </section>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading ? (
        <p>
          Carregando...
        </p>
      ) : filteredTasks.length === 0 ? (
        <div className="empty">
          Nenhuma tarefa encontrada.
        </div>
      ) : (
        <section className="tasks">

          {filteredTasks.map((task) => (
            <article
              className="task"
              key={task.id}
            >

              <div>

                <span
                  className={`status ${task.status.toLowerCase()}`}
                >
                  {
                    STATUS_LABELS[
                      task.status
                    ]
                  }
                </span>

                <h3>
                  {task.title}
                </h3>

                {task.description && (
                  <p>
                    {task.description}
                  </p>
                )}

              </div>

              <div className="actions">

                <button
                  onClick={() =>
                    changeStatus(task)
                  }
                >
                  Avançar
                </button>

                <button
                  className="danger"
                  onClick={() =>
                    handleDelete(
                      task.id
                    )
                  }
                >
                  Excluir
                </button>

              </div>

            </article>
          ))}

        </section>
      )}

    </main>
  );
}

export default App;