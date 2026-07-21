import { Inject, Injectable } from '@nestjs/common'
import { PartNotFoundError } from '../../domain/errors/inventory.errors'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'

@Injectable()
export class DeletePartUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const part = await this.parts.findById(id)
    if (!part) {
      throw new PartNotFoundError(id)
    }

    part.delete()
    await this.parts.update(part)
  }
}
