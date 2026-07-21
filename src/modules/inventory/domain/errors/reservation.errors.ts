export class InvalidReservationError extends Error {
  constructor(reason: string) {
    super(`Invalid reservation: ${reason}`)
    this.name = 'InvalidReservationError'
  }
}
