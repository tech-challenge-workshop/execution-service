import { Inject, Injectable } from '@nestjs/common'
import { ExecutionNotFoundError } from '../../domain/errors/execution.errors'
import { ConsumePartsUseCase } from '../../../inventory/application/use-cases/consume-parts.use-case'
import { EXECUTION_REPOSITORY } from '../ports/execution.repository'
import type { ExecutionRepository } from '../ports/execution.repository'
import { ExecutionOutput, toExecutionOutput } from '../models/execution.output'
import { TRACING_PORT } from '../../../../shared/observability/tracing.port'
import type { TracingPort } from '../../../../shared/observability/tracing.port'

@Injectable()
export class CompleteExecutionUseCase {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executions: ExecutionRepository,
    private readonly consumeParts: ConsumePartsUseCase,
    @Inject(TRACING_PORT)
    private readonly tracing: TracingPort,
  ) {}

  async execute(workOrderId: string): Promise<ExecutionOutput> {
    const span = this.tracing.startSpan('execution.complete', { workOrderId })
    try {
      const execution = await this.executions.findByWorkOrderId(workOrderId)
      if (!execution) {
        throw new ExecutionNotFoundError(workOrderId)
      }

      execution.complete()
      await this.executions.update(execution)
      await this.consumeParts.execute(workOrderId)

      return toExecutionOutput(execution)
    } catch (err) {
      span.error(err as Error)
      throw err
    } finally {
      span.finish()
    }
  }
}
