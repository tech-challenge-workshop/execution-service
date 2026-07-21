import { Part } from '../../../../src/modules/inventory/domain/part.entity'
import {
  InsufficientStockError,
  InvalidPartError,
  InvalidPriceError,
} from '../../../../src/modules/inventory/domain/errors/inventory.errors'
import { partWith } from '../part.fixtures'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function createInput(overrides: Record<string, unknown> = {}) {
  return { name: 'Brake pad', priceCents: 5000, initialQuantity: 100, ...overrides }
}

describe('Part', () => {
  describe('create', () => {
    it('creates a part with generated id, stock and timestamps', () => {
      const part = Part.create(createInput())

      expect(part.id).toMatch(UUID_PATTERN)
      expect(part.availableQuantity).toBe(100)
      expect(part.reservedQuantity).toBe(0)
      expect(part.price.cents).toBe(5000)
      expect(part.deletedAt).toBeNull()
    })

    it('rejects empty name, negative price and negative quantity', () => {
      expect(() => Part.create(createInput({ name: '  ' }))).toThrow(InvalidPartError)
      expect(() => Part.create(createInput({ priceCents: -1 }))).toThrow(InvalidPriceError)
      expect(() => Part.create(createInput({ initialQuantity: -5 }))).toThrow(InvalidPartError)
    })
  })

  describe('stock movements', () => {
    it('reserves by moving available into reserved', () => {
      const part = partWith({ availableQuantity: 10, reservedQuantity: 0 })

      part.reserve(3)

      expect(part.availableQuantity).toBe(7)
      expect(part.reservedQuantity).toBe(3)
    })

    it('rejects reserving more than available', () => {
      const part = partWith({ availableQuantity: 2 })

      expect(() => part.reserve(5)).toThrow(InsufficientStockError)
      expect(part.availableQuantity).toBe(2)
      expect(part.reservedQuantity).toBe(0)
    })

    it('releases reserved back into available', () => {
      const part = partWith({ availableQuantity: 7, reservedQuantity: 3 })

      part.release(3)

      expect(part.availableQuantity).toBe(10)
      expect(part.reservedQuantity).toBe(0)
    })

    it('caps release at the reserved amount (idempotent-safe)', () => {
      const part = partWith({ availableQuantity: 7, reservedQuantity: 3 })

      part.release(10)

      expect(part.reservedQuantity).toBe(0)
      expect(part.availableQuantity).toBe(10)
    })

    it('consumes reserved without returning to available', () => {
      const part = partWith({ availableQuantity: 7, reservedQuantity: 3 })

      part.consume(3)

      expect(part.reservedQuantity).toBe(0)
      expect(part.availableQuantity).toBe(7)
    })

    it('restocks available quantity', () => {
      const part = partWith({ availableQuantity: 5 })

      part.restock(10)

      expect(part.availableQuantity).toBe(15)
    })
  })

  describe('update and delete', () => {
    it('updates catalog fields and clears description with null', () => {
      const part = partWith()

      part.update({ name: 'Rear pad', priceCents: 6000, description: null })

      expect(part.name).toBe('Rear pad')
      expect(part.price.cents).toBe(6000)
      expect(part.description).toBeNull()
    })

    it('soft-deletes idempotently', () => {
      const deletedAt = new Date('2026-01-02T00:00:00Z')
      const part = partWith({ deletedAt })

      part.delete()

      expect(part.deletedAt).toEqual(deletedAt)
    })
  })
})
