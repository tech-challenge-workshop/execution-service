# execution-service

Execution, production and parts-inventory service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

One of three independent microservices:

| Service | Responsibility |
|---|---|
| work-order-service | Customers, vehicles, service catalog, work order lifecycle, saga orchestration |
| billing-service | Quotes and payments (Mercado Pago) |
| **execution-service** (this repo) | Parts inventory and stock control, repair execution, diagnostics |

Services communicate through RabbitMQ events (async, over a shared `saga` topic exchange) and REST (sync, only when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript — HTTP API plus a RabbitMQ **message bus** (topic exchange) in a single process
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) — fulfils the challenge's NoSQL requirement
- RabbitMQ for asynchronous messaging (saga participant)
- Zod for environment validation, class-validator for HTTP DTOs
- Jest (unit + e2e), Swagger for API docs

## Role in the saga

This service is a **participant** of the work order saga orchestrated by `work-order-service`. It consumes commands and replies with events:

| Consumes (command) | Reacts by |
|---|---|
| `parts.reserve` | Reserving stock and replying `parts.reserved` / `parts.reservation-failed` |
| `parts.release` | Releasing the reservation (compensation, idempotent) |
| `execution.start` | Creating an **execution queue entry** for the work order (status `QUEUED`) |

It also exposes `GET /parts?ids=...`, consumed synchronously by `work-order-service` when opening a work order to snapshot part prices.

## Execution lifecycle

`execution.start` does not finish the repair on its own — it puts the work order in the **execution queue**. A mechanic then drives it through HTTP, and only on completion are the reserved parts consumed and the saga notified:

| Endpoint | Effect |
|---|---|
| `GET /executions` / `GET /executions/:workOrderId` | Inspect the queue / a single execution with its diagnostics |
| `POST /executions/:workOrderId/diagnostics` | Record a diagnostic finding (a flexible document) → `IN_DIAGNOSIS` |
| `POST /executions/:workOrderId/start-repair` | → `IN_REPAIR` |
| `POST /executions/:workOrderId/complete` | Consume the reserved parts and publish `execution.completed` → `COMPLETED` |
| `POST /executions/:workOrderId/fail` | Publish `execution.failed` (triggers saga compensation) → `FAILED` |

So a full run pauses at `IN_EXECUTION` (on the work order side) until the mechanic completes the execution here — analogous to how the flow pauses at `AWAITING_APPROVAL` until the customer approves the quote in `billing-service`.

## Requirements

Node 24+, pnpm 10, Docker.

## Run this service

```bash
pnpm install
cp .env.example .env
docker compose up -d          # MongoDB
pnpm start:dev                # http://localhost:3002
```

| Endpoint | URL |
|---|---|
| API | http://localhost:3002 |
| Swagger UI | http://localhost:3002/docs |
| Health check | http://localhost:3002/health |

> **RabbitMQ dependency:** this service's `docker-compose.yml` starts **only MongoDB**. The RabbitMQ broker lives in `work-order-service`'s compose and is shared by both services. Start `work-order-service`'s containers (`docker compose up -d` there) before running this service, otherwise the message bus has nothing to connect to. Both services point at `amqp://…@localhost:5672` by default.

The parts REST API (`/parts`, CRUD + `GET /parts?ids=`) works standalone. The saga behaviour (reserve/release/consume) is exercised by messages from `work-order-service` — see the full walkthrough below.

## Run the full system (distributed saga demo)

The end-to-end saga — open a work order → reserve stock here → quote/payment → consume stock here → finish — is documented as a step-by-step walkthrough in the **work-order-service README** ("Run the full system"). In short:

```bash
# terminal 1 — work-order-service
docker compose up -d          # Postgres + RabbitMQ (shared broker)
npx prisma migrate dev
pnpm start:dev                # port 3000

# terminal 2 — execution-service (this repo)
docker compose up -d          # MongoDB
pnpm start:dev                # port 3002
```

Then create a part here (`POST /parts`), open a work order in work-order-service referencing it, and watch the part's `availableQuantity` / `reservedQuantity` change as the saga reserves and later consumes the stock.

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
