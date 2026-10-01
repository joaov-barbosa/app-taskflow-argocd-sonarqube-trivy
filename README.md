# Taskflow

Aplicação web de gerenciamento de tarefas desenvolvida com **React, Node.js e Redis**, containerizada com Docker e executada em um ambiente Kubernetes.

O projeto foi desenvolvido como laboratório prático para explorar conceitos de **Docker, Kubernetes, Ingress, Services, ConfigMaps, Secrets, Health Checks e comunicação entre workloads**.

---

## Arquitetura

A aplicação é composta por três principais componentes:

- **Frontend:** React servido por Nginx
- **Backend:** Node.js
- **Cache:** Redis

O acesso externo é realizado através de um **Ingress**, enquanto a comunicação entre os componentes ocorre através de **Kubernetes Services**.

```text
                        Browser
                            │
                            ▼
                    ┌───────────────┐
                    │    Ingress    │
                    │ taskflow.local│
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Frontend    │
                    │    Service    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Frontend Pods │
                    │     Nginx     │
                    └───────┬───────┘
                            │
                           /api
                            │
                            ▼
                    ┌───────────────┐
                    │    Backend    │
                    │    Service    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Backend Pods  │
                    │    Node.js    │
                    └───────┬───────┘
                            │
                    redis-service:6379
                            │
                            ▼
                    ┌───────────────┐
                    │     Redis     │
                    └───────────────┘