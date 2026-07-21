import { Part } from '../../domain/part.entity'

export const PART_REPOSITORY = Symbol('PART_REPOSITORY')

export interface ListPartsParams {
  page: number
  perPage: number
  search?: string
}

export interface PaginatedParts {
  items: Part[]
  total: number
}

export interface PartRepository {
  create(part: Part): Promise<void>
  update(part: Part): Promise<void>
  findById(id: string): Promise<Part | null>
  findByIds(ids: string[]): Promise<Part[]>
  list(params: ListPartsParams): Promise<PaginatedParts>
}
