import { Inject, Injectable } from '@nestjs/common'
import { PartNotFoundError } from '../../domain/errors/inventory.errors'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { PartOutput, toPartOutput } from '../models/part.output'

@Injectable()
export class GetPartUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(id: string): Promise<PartOutput> {
    const part = await this.parts.findById(id)
    if (!part) {
      throw new PartNotFoundError(id)
    }
    return toPartOutput(part)
  }
}
