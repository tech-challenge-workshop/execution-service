import { Inject, Injectable } from '@nestjs/common'
import { InsufficientStockError, PartNotFoundError } from '../../domain/errors/inventory.errors'
import { Part } from '../../domain/part.entity'
import { Reservation } from '../../domain/reservation.entity'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { RESERVATION_REPOSITORY } from '../ports/reservation.repository'
import type { ReservationRepository } from '../ports/reservation.repository'

export interface ReservePartsCommand {
  workOrderId: string
  items: { partId: string; quantity: number }[]
}

@Injectable()
export class ReservePartsUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
  ) {}

  async execute(command: ReservePartsCommand): Promise<void> {
    const existing = await this.reservations.findByWorkOrderId(command.workOrderId)
    if (existing || command.items.length === 0) {
      return
    }

    const found = await this.parts.findByIds(command.items.map((item) => item.partId))
    const byId = new Map(found.map((part) => [part.id, part]))

    for (const item of command.items) {
      const part = byId.get(item.partId)
      if (!part) {
        throw new PartNotFoundError(item.partId)
      }
      if (part.availableQuantity < item.quantity) {
        throw new InsufficientStockError(item.partId)
      }
    }

    const reserved: Part[] = []
    for (const item of command.items) {
      const part = byId.get(item.partId)!
      part.reserve(item.quantity)
      reserved.push(part)
    }

    for (const part of reserved) {
      await this.parts.update(part)
    }

    await this.reservations.create(
      Reservation.create({ workOrderId: command.workOrderId, items: command.items }),
    )
  }
}
