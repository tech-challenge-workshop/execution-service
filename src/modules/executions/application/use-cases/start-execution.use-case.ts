import { Inject, Injectable } from '@nestjs/common'
import { Execution } from '../../domain/execution.entity'
import { EXECUTION_REPOSITORY } from '../ports/execution.repository'
import type { ExecutionRepository } from '../ports/execution.repository'

@Injectable()
export class StartExecutionUseCase {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executions: ExecutionRepository,
  ) {}

  async execute(workOrderId: string): Promise<void> {
    const existing = await this.executions.findByWorkOrderId(workOrderId)
    if (existing) {
      return
    }
    await this.executions.create(Execution.start(workOrderId))
  }
}
