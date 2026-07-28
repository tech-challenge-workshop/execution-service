# execution-service

Execution, production and parts-inventory service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

One of four independent services:

| Service | Responsibility |
|---|---|
| [work-order-service](https://github.com/tech-challenge-workshop/work-order-service) | Customers, vehicles, service catalog, work order lifecycle, saga orchestration |
| [billing-service](https://github.com/tech-challenge-workshop/billing-service) | Quotes and payments (Mercado Pago) |
| **execution-service** (this repo) | Parts inventory and stock control, repair execution, diagnostics |
| [auth-service](https://github.com/tech-challenge-workshop/auth-service) | Issues the JWTs this service validates |
| [tech-platform](https://github.com/tech-challenge-workshop/tech-platform) | Kong gateway, Datadog agent, Kubernetes manifests, OpenTofu |

Services communicate through RabbitMQ events (async, over a shared `saga` topic exchange) and REST (sync, only when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript — HTTP API plus a RabbitMQ **message bus** (topic exchange) in a single process
- [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) — fulfils the challenge's NoSQL requirement
- RabbitMQ for asynchronous messaging (saga participant)
- `@nestjs/jwt` for token verification, Zod for environment validation, class-validator for HTTP DTOs
- `dd-trace` for Datadog APM, with structured JSON logs correlated by trace id
- Jest (unit + e2e), Swagger for API docs

## Role in the saga

This service is a **participant** of the work order saga orchestrated by `work-order-service`. It consumes commands and replies with events:

| Consumes (command) | Reacts by |
|---|---|
| `parts.reserve` | Reserving stock and replying `parts.reserved` / `parts.reservation-failed` |
| `parts.release` | Releasing the reservation (compensation, idempotent) |
| `execution.start` | Creating an **execution queue entry** for the work order (status `QUEUED`) |

It also exposes `GET /parts/prices?ids=`, consumed synchronously by `work-order-service` when opening a work order to snapshot part prices.

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

## Authentication

This service **validates** tokens, it never issues them — that is `auth-service`'s job. Both share the same HS256 `JWT_SECRET`.

Two guards are registered globally via `APP_GUARD`: `JwtAuthGuard` verifies the bearer token, then `RolesGuard` enforces `@Roles(...)`. A route marked `@Public()` skips both.

| Route | Role |
|---|---|
| `/parts` (CRUD, `:id/restock`) | `admin` |
| `GET /parts/prices?ids=` | **public** — service-to-service price snapshot for `work-order-service` |
| `/executions` (queue, diagnostics, start-repair, complete, fail) | `admin` |
| `GET /health` | **public** |

`GET /parts/prices` is public on purpose: it is an internal call from `work-order-service` while opening an order, before any user token exists in that flow. It returns prices only — no stock levels, no reservations. In production it is reachable only from inside the cluster; Kong exposes it without the `jwt` plugin but the route is not part of the public product surface.

## Business rules worth knowing

**Reservation.** `parts.reserve` succeeds only if every requested part has enough available quantity; otherwise it replies `parts.reservation-failed` and the saga compensates. A reservation moves quantity from available to reserved — it does not decrement stock.

**Release.** `parts.release` returns reserved quantity to available. It is idempotent, because saga messages can be redelivered.

**Consumption.** Only `POST /executions/:workOrderId/complete` actually decrements stock, converting the reservation into a permanent deduction.

**Prices in cents.** `priceCents` is an integer everywhere, matching the service catalog in `work-order-service`.

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

> **RabbitMQ dependency:** this service's `docker-compose.yml` starts **only MongoDB**. The RabbitMQ broker lives in `work-order-service`'s compose and is shared by every service. Start `work-order-service`'s containers first, otherwise the message bus has nothing to connect to.

The parts REST API works standalone (with an admin token). The saga behaviour — reserve, release, consume — is exercised by messages from `work-order-service`.

## Run the full system (distributed saga demo)

The end-to-end saga is documented step by step in the **work-order-service README** ("Run the full system"), including how to obtain the admin and customer tokens that every protected route now requires. In short:

```bash
# terminal 1 — work-order-service
docker compose up -d          # Postgres + RabbitMQ (shared broker)
npx prisma migrate dev
pnpm start:dev                # port 3000

# terminal 2 — billing-service
docker compose up -d && npx prisma migrate dev && pnpm start:dev   # port 3001

# terminal 3 — execution-service (this repo)
docker compose up -d          # MongoDB
pnpm start:dev                # port 3002

# terminal 4 — auth-service
pnpm start:dev                # port 3003
```

Then create a part here (`POST /parts`), open a work order in work-order-service referencing it, and watch `availableQuantity` / `reservedQuantity` change as the saga reserves and later consumes the stock.

## Observability

`dd-trace` reports APM traces to the Datadog Agent that `tech-platform`'s compose provides on `localhost:8126`. Application logs are JSON and carry `dd.trace_id` / `dd.span_id`. Saga message handlers are wrapped in custom spans through `TracingPort.withSpan()`, so a reservation appears inside the same distributed trace as the work order that triggered it.

## Deployment

Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`, `HPA`) live in [`tech-platform/k8s/execution-service`](https://github.com/tech-challenge-workshop/tech-platform/tree/main/k8s/execution-service). The AWS infrastructure behind them — VPC, EKS, DocumentDB, Amazon MQ — is OpenTofu in [`tech-platform/terraform`](https://github.com/tech-challenge-workshop/tech-platform/tree/main/terraform).

The `Deployment` also carries an init container that downloads the Amazon RDS CA
bundle, because DocumentDB enforces TLS with a certificate that is not publicly
trusted. Keeping that out of the image is what lets the same image run against a
plain MongoDB container locally.

**Why the manifests are not in this repository.** The four services are always
deployed to the same cluster, behind the same Kong gateway, by the same
pipeline. Keeping a `k8s/` directory per repository would duplicate the
namespace, the `Gateway`, the `HTTPRoute` set, the Kong plugins and the Datadog
values four times over, and those copies would drift the first time a route
changed. Centralising them keeps one kustomize tree that renders the whole
platform and is validated by `kubeconform` on every pull request. The trade-off
is deliberate: this repository owns its application and its image, the platform
repository owns how the platform is assembled.

CI builds and pushes the image to `ghcr.io/tech-challenge-workshop/execution-service` on every push to `main`.

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage (minimum 80%) |
| `pnpm test:e2e` | End-to-end tests (requires `docker compose up -d`) |
| `pnpm test:ci` | Combined unit + e2e coverage — the gate CI enforces |
| `pnpm lint` / `pnpm lint:check` | ESLint with/without autofix |

## Docker

```bash
docker build -t execution-service .
docker run --env-file .env -p 3002:3002 execution-service
```

## Contributing

`main` is protected: changes land through pull requests with code owner review. All code, comments and commit messages are written in English. Tests live in `tests/`, mirroring the `src/` structure.
