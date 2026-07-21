import { ArgumentsHost } from '@nestjs/common'
import { InventoryExceptionFilter } from '../../../src/modules/inventory/presentation/filters/inventory-exception.filter'
import {
  InsufficientStockError,
  InvalidPartError,
  InvalidPriceError,
  PartNotFoundError,
} from '../../../src/modules/inventory/domain/errors/inventory.errors'

function statusFor(error: Error): number {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() }
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost

  new InventoryExceptionFilter().catch(error, host)
  return (response.status.mock.calls[0] as [number])[0]
}

describe('InventoryExceptionFilter', () => {
  it('maps domain errors to HTTP status codes', () => {
    expect(statusFor(new PartNotFoundError('p-1'))).toBe(404)
    expect(statusFor(new InsufficientStockError('p-1'))).toBe(409)
    expect(statusFor(new InvalidPartError('bad'))).toBe(400)
    expect(statusFor(new InvalidPriceError(-1))).toBe(400)
  })
})
