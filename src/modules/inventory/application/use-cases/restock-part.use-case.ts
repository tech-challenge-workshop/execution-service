import { Inject, Injectable } from '@nestjs/common'
import { PartNotFoundError } from '../../domain/errors/inventory.errors'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { PartOutput, toPartOutput } from '../models/part.output'

export interface RestockPartCommand {
  id: string
  quantity: number
}

@Injectable()
export class RestockPartUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(command: RestockPartCommand): Promise<PartOutput> {
    const part = await this.parts.findById(command.id)
    if (!part) {
      throw new PartNotFoundError(command.id)
    }

    part.restock(command.quantity)
    await this.parts.update(part)
    return toPartOutput(part)
  }
}
