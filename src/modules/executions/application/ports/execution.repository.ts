import { Execution } from '../../domain/execution.entity'
import { ExecutionStatus } from '../../domain/execution.entity'

export const EXECUTION_REPOSITORY = Symbol('EXECUTION_REPOSITORY')

export interface ListExecutionsParams {
  page: number
  perPage: number
  status?: ExecutionStatus
}

export interface PaginatedExecutions {
  items: Execution[]
  total: number
}

export interface ExecutionRepository {
  create(execution: Execution): Promise<void>
  update(execution: Execution): Promise<void>
  findByWorkOrderId(workOrderId: string): Promise<Execution | null>
  list(params: ListExecutionsParams): Promise<PaginatedExecutions>
}
