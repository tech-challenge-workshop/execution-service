import { Inject, Injectable } from '@nestjs/common'
import { ExecutionNotFoundError } from '../../domain/errors/execution.errors'
import { EXECUTION_REPOSITORY } from '../ports/execution.repository'
import type { ExecutionRepository } from '../ports/execution.repository'
import { ExecutionOutput, toExecutionOutput } from '../models/execution.output'

@Injectable()
export class FailExecutionUseCase {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executions: ExecutionRepository,
  ) {}

  async execute(workOrderId: string): Promise<ExecutionOutput> {
    const execution = await this.executions.findByWorkOrderId(workOrderId)
    if (!execution) {
      throw new ExecutionNotFoundError(workOrderId)
    }

    execution.fail()
    await this.executions.update(execution)
    return toExecutionOutput(execution)
  }
}
