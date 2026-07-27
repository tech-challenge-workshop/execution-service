import { Inject, Injectable } from '@nestjs/common'
import { Execution } from '../../domain/execution.entity'
import { EXECUTION_REPOSITORY } from '../ports/execution.repository'
import type { ExecutionRepository } from '../ports/execution.repository'
import { TRACING_PORT } from '../../../../shared/observability/tracing.port'
import type { TracingPort } from '../../../../shared/observability/tracing.port'

@Injectable()
export class StartExecutionUseCase {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executions: ExecutionRepository,
    @Inject(TRACING_PORT)
    private readonly tracing: TracingPort,
  ) {}

  execute(workOrderId: string): Promise<void> {
    return this.tracing.withSpan('execution.start', { workOrderId }, async () => {
      const existing = await this.executions.findByWorkOrderId(workOrderId)
      if (existing) {
        return
      }
      await this.executions.create(Execution.start(workOrderId))
    })
  }
}
