import { InvalidExecutionError, InvalidExecutionTransitionError } from './errors/execution.errors'

export enum ExecutionStatus {
  QUEUED = 'QUEUED',
  IN_DIAGNOSIS = 'IN_DIAGNOSIS',
  IN_REPAIR = 'IN_REPAIR',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface DiagnosticEntry {
  description: string
  details: Record<string, unknown> | null
  recordedAt: Date
}

export interface ExecutionProps {
  workOrderId: string
  status: ExecutionStatus
  diagnostics: DiagnosticEntry[]
  createdAt: Date
  updatedAt: Date
}

export interface AddDiagnosticInput {
  description: string
  details?: Record<string, unknown>
}

const TERMINAL = [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]

export class Execution {
  private constructor(private readonly props: ExecutionProps) {}

  static start(workOrderId: string): Execution {
    const now = new Date()
    return new Execution({
      workOrderId,
      status: ExecutionStatus.QUEUED,
      diagnostics: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: ExecutionProps): Execution {
    return new Execution(props)
  }

  addDiagnostic(input: AddDiagnosticInput): void {
    if (this.isTerminal) {
      throw new InvalidExecutionTransitionError(this.props.status, 'add a diagnostic')
    }
    const description = input.description.trim()
    if (description.length === 0) {
      throw new InvalidExecutionError('diagnostic description must not be empty')
    }

    this.props.diagnostics.push({
      description,
      details: input.details ?? null,
      recordedAt: new Date(),
    })
    if (this.props.status === ExecutionStatus.QUEUED) {
      this.props.status = ExecutionStatus.IN_DIAGNOSIS
    }
    this.touch()
  }

  startRepair(): void {
    if (
      this.props.status !== ExecutionStatus.QUEUED &&
      this.props.status !== ExecutionStatus.IN_DIAGNOSIS
    ) {
      throw new InvalidExecutionTransitionError(this.props.status, 'start the repair')
    }
    this.props.status = ExecutionStatus.IN_REPAIR
    this.touch()
  }

  complete(): void {
    if (
      this.props.status !== ExecutionStatus.IN_DIAGNOSIS &&
      this.props.status !== ExecutionStatus.IN_REPAIR
    ) {
      throw new InvalidExecutionTransitionError(this.props.status, 'complete the execution')
    }
    this.props.status = ExecutionStatus.COMPLETED
    this.touch()
  }

  fail(): void {
    if (this.isTerminal) {
      throw new InvalidExecutionTransitionError(this.props.status, 'fail the execution')
    }
    this.props.status = ExecutionStatus.FAILED
    this.touch()
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  get workOrderId(): string {
    return this.props.workOrderId
  }

  get status(): ExecutionStatus {
    return this.props.status
  }

  get diagnostics(): readonly DiagnosticEntry[] {
    return this.props.diagnostics
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get isTerminal(): boolean {
    return TERMINAL.includes(this.props.status)
  }
}
