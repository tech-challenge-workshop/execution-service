import {
  Reservation,
  ReservationProps,
  ReservationStatus,
} from '../../../src/modules/inventory/domain/reservation.entity'
import type { ReservationRepository } from '../../../src/modules/inventory/application/ports/reservation.repository'

export function reservationWith(overrides: Partial<ReservationProps> = {}): Reservation {
  return Reservation.restore({
    workOrderId: 'work-order-1',
    status: ReservationStatus.RESERVED,
    items: [{ partId: 'part-1', quantity: 2 }],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  })
}

export class FakeReservationRepository implements ReservationRepository {
  reservations = new Map<string, Reservation>()

  create(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.workOrderId, reservation)
    return Promise.resolve()
  }

  update(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.workOrderId, reservation)
    return Promise.resolve()
  }

  findByWorkOrderId(workOrderId: string): Promise<Reservation | null> {
    return Promise.resolve(this.reservations.get(workOrderId) ?? null)
  }
}
