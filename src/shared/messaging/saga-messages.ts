export const SagaMessage = {
  ReserveParts: 'parts.reserve',
  PartsReserved: 'parts.reserved',
  PartsReservationFailed: 'parts.reservation-failed',
  ReleaseParts: 'parts.release',
  StartExecution: 'execution.start',
  ExecutionCompleted: 'execution.completed',
  ExecutionFailed: 'execution.failed',
} as const

export interface ReservePartsPayload {
  workOrderId: string
  parts: { partId: string; quantity: number }[]
}

export interface WorkOrderRefPayload {
  workOrderId: string
}
