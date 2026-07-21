import { Inject, Injectable } from '@nestjs/common'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { PartPriceOutput, toPartPriceOutput } from '../models/part.output'

@Injectable()
export class GetPartPricesUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(ids: string[]): Promise<PartPriceOutput[]> {
    if (ids.length === 0) {
      return []
    }
    const parts = await this.parts.findByIds(ids)
    return parts.map(toPartPriceOutput)
  }
}
