import { Inject, Injectable } from '@nestjs/common'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository, ListPartsParams } from '../ports/part.repository'
import { PartOutput, toPartOutput } from '../models/part.output'

export interface ListPartsOutput {
  items: PartOutput[]
  total: number
  page: number
  perPage: number
}

@Injectable()
export class ListPartsUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(params: ListPartsParams): Promise<ListPartsOutput> {
    const { items, total } = await this.parts.list(params)
    return {
      items: items.map(toPartOutput),
      total,
      page: params.page,
      perPage: params.perPage,
    }
  }
}
