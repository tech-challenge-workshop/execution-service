import { Execution } from '../../domain/execution.entity'

export interface DiagnosticOutput {
  description: string
  details: Record<string, unknown> | null
  recordedAt: Date
}

export interface ExecutionOutput {
  workOrderId: string
  status: string
  diagnostics: DiagnosticOutput[]
  createdAt: Date
  updatedAt: Date
}

export function toExecutionOutput(execution: Execution): ExecutionOutput {
  return {
    workOrderId: execution.workOrderId,
    status: execution.status,
    diagnostics: execution.diagnostics.map((entry) => ({
      description: entry.description,
      details: entry.details,
      recordedAt: entry.recordedAt,
    })),
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
  }
}
