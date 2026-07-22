export class InvalidExecutionError extends Error {
  constructor(reason: string) {
    super(`Invalid execution: ${reason}`)
    this.name = 'InvalidExecutionError'
  }
}

export class ExecutionNotFoundError extends Error {
  constructor(workOrderId: string) {
    super(`Execution not found for work order: ${workOrderId}`)
    this.name = 'ExecutionNotFoundError'
  }
}

export class InvalidExecutionTransitionError extends Error {
  constructor(from: string, action: string) {
    super(`Invalid execution transition: cannot ${action} from ${from}`)
    this.name = 'InvalidExecutionTransitionError'
  }
}
