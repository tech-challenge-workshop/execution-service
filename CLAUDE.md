# execution-service

Microserviço de **Execução, Produção e Estoque de Peças** do Tech Challenge FIAP (Fase 4) — sistema de oficina mecânica em microserviços. Requisitos completos em `../REQUISITOS.md` (fora deste repo, no diretório da organização).

## Responsabilidades deste serviço

- **Estoque de peças** (dono do catálogo de peças): CRUD de peças/insumos com preço e quantidade
- **Controle de estoque**: reserva na abertura da OS, baixa na execução, devolução na compensação da Saga
- **Fila de execução**: gestão das OS aprovadas/pagas, diagnóstico e progresso dos reparos
- **Participante da Saga**: consome comandos do `work-order-service` (`parts.reserve`, `parts.release`, `execution.start`) e responde com eventos (`parts.reserved`, `execution.completed`, etc.)
- **API REST de preços de peças**: consumida pelo `work-order-service` (`PartCatalogGateway`) na abertura da OS

**Fora do escopo:** ciclo de vida da OS e orquestração da Saga (`work-order-service`); orçamento e pagamento (`billing-service`). Nenhum serviço acessa o banco de outro — só via eventos RabbitMQ ou REST.

## Stack

- **NestJS 11** + TypeScript, **pnpm** (não usar npm/yarn)
- **Processo único** (hybrid application): HTTP + consumers RabbitMQ juntos no `main.ts`
- **MongoDB** via **Mongoose** (`@nestjs/mongoose`) — cumpre o requisito NoSQL do desafio
- **RabbitMQ** via `@nestjs/microservices` (participante da Saga)
- Zod para validação de env, class-validator para DTOs HTTP
- **Jest** (unit + e2e), cobertura mínima **80%**; Swagger em `/docs`

## Comandos

```bash
pnpm install
pnpm start:dev
pnpm build
pnpm test
pnpm test:cov          # manter ≥80%
pnpm test:e2e          # requer docker compose up antes
pnpm lint:check
docker compose up -d   # MongoDB local
```

Antes de concluir qualquer tarefa: `pnpm lint:check && pnpm test && pnpm build`.

## Convenções de portas e filas

- HTTP: **3002** | MongoDB: **27017** | Fila RabbitMQ: **execution_queue**
- RabbitMQ é **compartilhado** (sobe no compose do work-order-service); aqui só nos conectamos a ele.

## Arquitetura (Clean Architecture, módulos por contexto)

```
src/
├── modules/
│   ├── inventory/          # peças, estoque, reserva
│   │   ├── domain/         # entidades, value objects, regras
│   │   ├── application/    # use cases + ports
│   │   ├── presentation/   # controllers HTTP, DTOs, consumers de eventos
│   │   └── infra/          # repositórios Mongoose, publishers RabbitMQ
│   └── executions/         # fila de execução e diagnóstico
└── shared/                 # config, database, messaging, health
tests/                      # todos os testes, espelhando src/
```

Regras de dependência: `domain` → nada; `application` → domain (define ports); `presentation`/`infra` → application. Framework e Mongoose nunca vazam para domain/application.

## Regras de negócio

- **Reserva de estoque**: `parts.reserve` só tem sucesso se houver quantidade disponível para todas as peças; senão responde `parts.reservation-failed`. A reserva desconta do disponível.
- **Devolução (compensação)**: `parts.release` devolve a quantidade reservada ao disponível. Idempotente.
- **Snapshot de preço**: o preço trafega em centavos inteiros (`priceCents`), igual ao catálogo de serviços do work-order.

## Testes

- TDD; domain/application testados sem Nest/DB (fakes dos ports).
- Todos os testes em `tests/`, espelhando `src/`. Nunca `.spec.ts` dentro de `src/`.
- Cobertura ≥80% é gate de CI.

## Convenções gerais

- Código, comentários e commits **em inglês**; código autoexplicativo, **sem comentários**.
- Prettier `semi: false`, printWidth 100, aspas simples.
- `main` protegida; mudanças via Pull Request com review do code owner.
- Nunca mencionar Claude em commits/PRs.
