import { randomUUID } from 'node:crypto'
import { Part, PartProps } from '../../../src/modules/inventory/domain/part.entity'
import { Money } from '../../../src/modules/inventory/domain/value-objects/money'
import type {
  PartRepository,
  ListPartsParams,
  PaginatedParts,
} from '../../../src/modules/inventory/application/ports/part.repository'

export function partWith(overrides: Partial<PartProps> = {}): Part {
  return Part.restore({
    id: randomUUID(),
    name: 'Brake pad',
    description: 'Front ceramic brake pad',
    price: Money.fromCents(5000),
    availableQuantity: 100,
    reservedQuantity: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  })
}

export class FakePartRepository implements PartRepository {
  parts: Part[] = []
  updateCalls = 0

  create(part: Part): Promise<void> {
    this.parts.push(part)
    return Promise.resolve()
  }

  update(_part: Part): Promise<void> {
    this.updateCalls += 1
    return Promise.resolve()
  }

  findById(id: string): Promise<Part | null> {
    return Promise.resolve(this.parts.find((part) => part.id === id && !part.isDeleted) ?? null)
  }

  findByIds(ids: string[]): Promise<Part[]> {
    return Promise.resolve(this.parts.filter((part) => ids.includes(part.id) && !part.isDeleted))
  }

  list(params: ListPartsParams): Promise<PaginatedParts> {
    const search = params.search?.toLowerCase()
    const matches = this.parts
      .filter((part) => !part.isDeleted)
      .filter((part) => !search || part.name.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name))

    const start = (params.page - 1) * params.perPage
    return Promise.resolve({
      items: matches.slice(start, start + params.perPage),
      total: matches.length,
    })
  }
}
