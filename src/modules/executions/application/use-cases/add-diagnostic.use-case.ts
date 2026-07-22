import { Inject, Injectable } from '@nestjs/common'
import { ExecutionNotFoundError } from '../../domain/errors/execution.errors'
import { EXECUTION_REPOSITORY } from '../ports/execution.repository'
import type { ExecutionRepository } from '../ports/execution.repository'
import { ExecutionOutput, toExecutionOutput } from '../models/execution.output'

export interface AddDiagnosticCommand {
  workOrderId: string
  description: string
  details?: Record<string, unknown>
}

@Injectable()
export class AddDiagnosticUseCase {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executions: ExecutionRepository,
  ) {}

  async execute(command: AddDiagnosticCommand): Promise<ExecutionOutput> {
    const execution = await this.executions.findByWorkOrderId(command.workOrderId)
    if (!execution) {
      throw new ExecutionNotFoundError(command.workOrderId)
    }

    execution.addDiagnostic({ description: command.description, details: command.details })
    await this.executions.update(execution)
    return toExecutionOutput(execution)
  }
}
