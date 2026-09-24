# Taskflow

Aplicação web de gerenciamento de tarefas desenvolvida com **React, Node.js e Redis**, containerizada com Docker e executada em um ambiente Kubernetes.

O projeto foi desenvolvido como laboratório prático para explorar conceitos de **Docker, Kubernetes, Ingress, Services, ConfigMaps, Secrets, Health Checks e comunicação entre workloads**.

---

## Arquitetura

A aplicação é composta por três principais componentes:

* **Frontend:** React servido por Nginx
* **Backend:** Node.js
* **Cache:** Redis

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
                    │    Frontend   │
                    │    Service    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Frontend Pods │
                    │    Nginx      │
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
```

### Fluxo da aplicação

1. O usuário acessa `taskflow.local` pelo navegador.
2. O **Ingress** recebe a requisição HTTP.
3. O tráfego é direcionado para o **Frontend Service**.
4. O Service distribui as requisições para os pods do Nginx.
5. O Nginx entrega a aplicação React ao navegador.
6. Requisições para `/api` são encaminhadas para o **Backend Service**.
7. O Backend Service direciona as requisições para os pods Node.js.
8. O backend utiliza o **Redis Service** para comunicação com o Redis.
9. O Redis armazena os dados utilizados pela aplicação.

---

## Stack

### Aplicação

* React
* Node.js
* Nginx
* Redis

### Containers

* Docker
* Docker Compose

### Kubernetes

* Namespace
* Deployments
* Services
* Ingress
* ConfigMap
* Secret
* Liveness Probe
* Readiness Probe

### DevOps

* Git
* Docker Hub
* Kubernetes
* Argo CD

---

## Estrutura do projeto

```text
taskflow/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── tasks.js
│   │   ├── services/
│   │   │   └── redis.js
│   │   ├── config.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
│
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── ingress.yaml
│   │
│   ├── backend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   │
│   └── redis/
│       ├── deployment.yaml
│       └── service.yaml
│
└── README.md
```

---

## Backend

O backend é desenvolvido em **Node.js** e possui a responsabilidade de disponibilizar a API utilizada pelo frontend.

Principais componentes:

```text
backend/src/
├── routes/
│   └── tasks.js
├── services/
│   └── redis.js
├── config.js
└── server.js
```

### Routes

`tasks.js` contém as rotas relacionadas ao gerenciamento das tarefas.

### Services

`redis.js` concentra a comunicação entre a aplicação Node.js e o Redis.

### Config

`config.js` centraliza as configurações utilizadas pela aplicação.

### Server

`server.js` inicializa o servidor HTTP e registra as rotas da aplicação.

---

## Frontend

O frontend é desenvolvido em **React** e servido através do **Nginx**.

```text
frontend/src/
├── App.jsx
├── api.js
├── main.jsx
└── styles.css
```

O Nginx também é utilizado como ponto de encaminhamento das requisições da API.

As requisições realizadas para:

```text
/api
```

são encaminhadas para o backend através do Service Kubernetes.

---

## Kubernetes

Os recursos Kubernetes estão organizados dentro do diretório:

```text
k8s/
```

### Namespace

A aplicação é isolada em um namespace próprio:

```text
taskflow
```

### Backend

O backend possui um Deployment responsável pelo gerenciamento dos pods Node.js e um Service responsável pela comunicação interna.

```text
backend/
├── deployment.yaml
└── service.yaml
```

### Frontend

O frontend possui um Deployment com os pods Nginx e um Service utilizado pelo Ingress.

```text
frontend/
├── deployment.yaml
└── service.yaml
```

### Redis

O Redis também é executado dentro do cluster:

```text
redis/
├── deployment.yaml
└── service.yaml
```

O backend acessa o Redis através do DNS interno:

```text
redis-service:6379
```

---

## Configuração

Configurações não sensíveis são armazenadas através de um **ConfigMap**.

```text
k8s/configmap.yaml
```

Informações sensíveis são configuradas através de um **Secret**.

```text
k8s/secret.yaml
```

> Em ambientes reais, os valores sensíveis não devem ser versionados diretamente no Git. Este projeto utiliza Secrets como parte do laboratório de Kubernetes.

## Testes

O projeto possui testes automatizados para o **Frontend** e **Backend**.

### Frontend

O frontend utiliza **Vitest** e **Testing Library**.

```bash
cd frontend
npm install
npm run test
