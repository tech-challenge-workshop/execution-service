import {
  Reservation,
  ReservationStatus,
} from '../../../../src/modules/inventory/domain/reservation.entity'
import { InvalidReservationError } from '../../../../src/modules/inventory/domain/errors/reservation.errors'

describe('Reservation', () => {
  it('creates in RESERVED status with items', () => {
    const reservation = Reservation.create({
      workOrderId: 'wo-1',
      items: [{ partId: 'p-1', quantity: 2 }],
    })

    expect(reservation.status).toBe(ReservationStatus.RESERVED)
    expect(reservation.isActive).toBe(true)
    expect(reservation.items).toHaveLength(1)
  })

  it('rejects creation without items', () => {
    expect(() => Reservation.create({ workOrderId: 'wo-1', items: [] })).toThrow(
      InvalidReservationError,
    )
  })

  it('releases only from the reserved state (idempotent)', () => {
    const reservation = Reservation.create({
      workOrderId: 'wo-1',
      items: [{ partId: 'p', quantity: 1 }],
    })

    reservation.release()
    expect(reservation.status).toBe(ReservationStatus.RELEASED)

    reservation.consume()
    expect(reservation.status).toBe(ReservationStatus.RELEASED)
  })

  it('consumes only from the reserved state (idempotent)', () => {
    const reservation = Reservation.create({
      workOrderId: 'wo-1',
      items: [{ partId: 'p', quantity: 1 }],
    })

    reservation.consume()
    expect(reservation.status).toBe(ReservationStatus.CONSUMED)
    expect(reservation.isActive).toBe(false)

    reservation.release()
    expect(reservation.status).toBe(ReservationStatus.CONSUMED)
  })
})
