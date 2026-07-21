import { Part } from '../../domain/part.entity'

export interface PartOutput {
  id: string
  name: string
  description: string | null
  priceCents: number
  availableQuantity: number
  reservedQuantity: number
  createdAt: Date
  updatedAt: Date
}

export interface PartPriceOutput {
  partId: string
  description: string
  unitPriceCents: number
}

export function toPartOutput(part: Part): PartOutput {
  return {
    id: part.id,
    name: part.name,
    description: part.description,
    priceCents: part.price.cents,
    availableQuantity: part.availableQuantity,
    reservedQuantity: part.reservedQuantity,
    createdAt: part.createdAt,
    updatedAt: part.updatedAt,
  }
}

export function toPartPriceOutput(part: Part): PartPriceOutput {
  return {
    partId: part.id,
    description: part.name,
    unitPriceCents: part.price.cents,
  }
}
