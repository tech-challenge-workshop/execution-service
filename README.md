# execution-service

Execution, production and parts-inventory service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

One of three independent microservices:

| Service | Responsibility |
|---|---|
| work-order-service | Customers, vehicles, service catalog, work order lifecycle, saga orchestration |
| billing-service | Quotes and payments (Mercado Pago) |
| **execution-service** (this repo) | Parts inventory and stock control, repair execution queue, diagnostics |

Services communicate through RabbitMQ events (async) and REST (sync, when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript, running as a hybrid application (HTTP + RabbitMQ consumer in a single process)
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) — fulfils the challenge's NoSQL requirement
- RabbitMQ for messaging (saga participant)
- Zod for environment validation, class-validator for HTTP DTOs
- Jest (unit + e2e), Swagger for API docs

## Role in the saga

This service is a **participant** of the work order saga orchestrated by `work-order-service`. It consumes commands and replies with events:

| Consumes (command) | Replies (event) |
|---|---|
| `parts.reserve` | `parts.reserved` / `parts.reservation-failed` |
| `parts.release` | — (compensation, idempotent) |
| `execution.start` | `execution.completed` / `execution.failed` |

It also exposes `GET /parts?ids=...`, consumed synchronously by `work-order-service` when opening a work order to snapshot part prices.

## Getting started

Requirements: Node 24+, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d          # MongoDB
pnpm start:dev
```

- API: `http://localhost:3002`
- Swagger UI: `http://localhost:3002/docs`
- Health check: `http://localhost:3002/health`

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage (minimum 80%) |
| `pnpm test:e2e` | End-to-end tests (requires `docker compose up -d`) |
| `pnpm lint` / `pnpm lint:check` | ESLint with/without autofix |

## Docker

```bash
docker build -t execution-service .
docker run --env-file .env -p 3002:3002 execution-service
```

## Contributing

`main` is protected: changes land through pull requests with code owner review. All code, comments and commit messages are written in English. Tests live in `tests/`, mirroring the `src/` structure.
