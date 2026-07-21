import { Inject, Injectable } from '@nestjs/common'
import { PART_REPOSITORY } from '../ports/part.repository'
import type { PartRepository } from '../ports/part.repository'
import { RESERVATION_REPOSITORY } from '../ports/reservation.repository'
import type { ReservationRepository } from '../ports/reservation.repository'

@Injectable()
export class ConsumePartsUseCase {
  constructor(
    @Inject(PART_REPOSITORY)
    private readonly parts: PartRepository,
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
  ) {}

  async execute(workOrderId: string): Promise<void> {
    const reservation = await this.reservations.findByWorkOrderId(workOrderId)
    if (!reservation || !reservation.isActive) {
      return
    }

    for (const item of reservation.items) {
      const part = await this.parts.findById(item.partId)
      if (part) {
        part.consume(item.quantity)
        await this.parts.update(part)
      }
    }

    reservation.consume()
    await this.reservations.update(reservation)
  }
}
