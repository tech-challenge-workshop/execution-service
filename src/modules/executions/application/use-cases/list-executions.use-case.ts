import { Inject, Injectable } from '@nestjs/common'
import { EXECUTION_REPOSITORY } from '../ports/execution.repository'
import type { ExecutionRepository, ListExecutionsParams } from '../ports/execution.repository'
import { ExecutionOutput, toExecutionOutput } from '../models/execution.output'

export interface ListExecutionsOutput {
  items: ExecutionOutput[]
  total: number
  page: number
  perPage: number
}

@Injectable()
export class ListExecutionsUseCase {
  constructor(
    @Inject(EXECUTION_REPOSITORY)
    private readonly executions: ExecutionRepository,
  ) {}

  async execute(params: ListExecutionsParams): Promise<ListExecutionsOutput> {
    const { items, total } = await this.executions.list(params)
    return {
      items: items.map(toExecutionOutput),
      total,
      page: params.page,
      perPage: params.perPage,
    }
  }
}
