import { randomUUID } from 'node:crypto'
import { InsufficientStockError, InvalidPartError } from './errors/inventory.errors'
import { Money } from './value-objects/money'

export interface PartProps {
  id: string
  name: string
  description: string | null
  price: Money
  availableQuantity: number
  reservedQuantity: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface CreatePartInput {
  name: string
  description?: string
  priceCents: number
  initialQuantity: number
}

export interface UpdatePartInput {
  name?: string
  description?: string | null
  priceCents?: number
}

function validateName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    throw new InvalidPartError('name must not be empty')
  }
  return trimmed
}

function normalizeDescription(description: string | null): string | null {
  if (description === null) {
    return null
  }
  const trimmed = description.trim()
  return trimmed.length === 0 ? null : trimmed
}

function validateQuantity(quantity: number): number {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new InvalidPartError('quantity must be a non-negative integer')
  }
  return quantity
}

export class Part {
  private constructor(private readonly props: PartProps) {}

  static create(input: CreatePartInput): Part {
    const now = new Date()

    return new Part({
      id: randomUUID(),
      name: validateName(input.name),
      description: normalizeDescription(input.description ?? null),
      price: Money.fromCents(input.priceCents),
      availableQuantity: validateQuantity(input.initialQuantity),
      reservedQuantity: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  static restore(props: PartProps): Part {
    return new Part(props)
  }

  update(input: UpdatePartInput): void {
    if (input.name !== undefined) {
      this.props.name = validateName(input.name)
    }
    if (input.description !== undefined) {
      this.props.description = normalizeDescription(input.description)
    }
    if (input.priceCents !== undefined) {
      this.props.price = Money.fromCents(input.priceCents)
    }
    this.touch()
  }

  restock(quantity: number): void {
    this.props.availableQuantity += validateQuantity(quantity)
    this.touch()
  }

  reserve(quantity: number): void {
    const amount = validateQuantity(quantity)
    if (this.props.availableQuantity < amount) {
      throw new InsufficientStockError(this.props.id)
    }
    this.props.availableQuantity -= amount
    this.props.reservedQuantity += amount
    this.touch()
  }

  release(quantity: number): void {
    const amount = Math.min(validateQuantity(quantity), this.props.reservedQuantity)
    this.props.reservedQuantity -= amount
    this.props.availableQuantity += amount
    this.touch()
  }

  consume(quantity: number): void {
    const amount = Math.min(validateQuantity(quantity), this.props.reservedQuantity)
    this.props.reservedQuantity -= amount
    this.touch()
  }

  delete(): void {
    if (this.props.deletedAt === null) {
      this.props.deletedAt = new Date()
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description
  }

  get price(): Money {
    return this.props.price
  }

  get availableQuantity(): number {
    return this.props.availableQuantity
  }

  get reservedQuantity(): number {
    return this.props.reservedQuantity
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null
  }
}
