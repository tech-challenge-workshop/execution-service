import { Inject, Injectable } from '@nestjs/common'
import { Part } from '../../domain/part.entity'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { PartOutput, toPartOutput } from '../models/part.output'

export interface CreatePartCommand {
  name: string
  description?: string
  priceCents: number
  initialQuantity: number
}

@Injectable()
export class CreatePartUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
  ) {}

  async execute(command: CreatePartCommand): Promise<PartOutput> {
    const part = Part.create(command)
    await this.parts.create(part)
    return toPartOutput(part)
  }
}
