import { randomUUID } from 'node:crypto'
import {
  Execution,
  ExecutionProps,
  ExecutionStatus,
} from '../../../src/modules/executions/domain/execution.entity'
import type {
  ExecutionRepository,
  ListExecutionsParams,
  PaginatedExecutions,
} from '../../../src/modules/executions/application/ports/execution.repository'

export function executionWith(overrides: Partial<ExecutionProps> = {}): Execution {
  return Execution.restore({
    workOrderId: randomUUID(),
    status: ExecutionStatus.QUEUED,
    diagnostics: [],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  })
}

export class FakeExecutionRepository implements ExecutionRepository {
  executions = new Map<string, Execution>()

  create(execution: Execution): Promise<void> {
    this.executions.set(execution.workOrderId, execution)
    return Promise.resolve()
  }

  update(execution: Execution): Promise<void> {
    this.executions.set(execution.workOrderId, execution)
    return Promise.resolve()
  }

  findByWorkOrderId(workOrderId: string): Promise<Execution | null> {
    return Promise.resolve(this.executions.get(workOrderId) ?? null)
  }

  list(params: ListExecutionsParams): Promise<PaginatedExecutions> {
    const matches = [...this.executions.values()]
      .filter((execution) => !params.status || execution.status === params.status)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const start = (params.page - 1) * params.perPage
    return Promise.resolve({
      items: matches.slice(start, start + params.perPage),
      total: matches.length,
    })
  }
}
