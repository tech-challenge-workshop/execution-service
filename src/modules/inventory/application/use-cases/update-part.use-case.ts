import { Inject, Injectable } from '@nestjs/common'
import { PartNotFoundError } from '../../domain/errors/inventory.errors'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { PartOutput, toPartOutput } from '../models/part.output'

export interface UpdatePartCommand {
  id: string
  name?: string
  description?: string | null
  priceCents?: number
}

@Injectable()
export class UpdatePartUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(command: UpdatePartCommand): Promise<PartOutput> {
    const part = await this.parts.findById(command.id)
    if (!part) {
      throw new PartNotFoundError(command.id)
    }

    part.update({
      name: command.name,
      description: command.description,
      priceCents: command.priceCents,
    })
    await this.parts.update(part)
    return toPartOutput(part)
  }
}
