export class InvalidPriceError extends Error {
  constructor(cents: number) {
    super(`Invalid price: ${cents} (must be a non-negative integer amount in cents)`)
    this.name = 'InvalidPriceError'
  }
}

export class InvalidPartError extends Error {
  constructor(reason: string) {
    super(`Invalid part: ${reason}`)
    this.name = 'InvalidPartError'
  }
}

export class PartNotFoundError extends Error {
  constructor(id: string) {
    super(`Part not found: ${id}`)
    this.name = 'PartNotFoundError'
  }
}

export class InsufficientStockError extends Error {
  constructor(partId: string) {
    super(`Insufficient stock for part: ${partId}`)
    this.name = 'InsufficientStockError'
  }
}
