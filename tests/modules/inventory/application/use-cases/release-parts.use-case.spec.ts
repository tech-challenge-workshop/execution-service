import { ReservationStatus } from '../../../../../src/modules/inventory/domain/reservation.entity'
import { ReleasePartsUseCase } from '../../../../../src/modules/inventory/application/use-cases/release-parts.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'
import { FakeReservationRepository, reservationWith } from '../../reservation.fixtures'

describe('ReleasePartsUseCase', () => {
  let parts: FakePartRepository
  let reservations: FakeReservationRepository
  let useCase: ReleasePartsUseCase

  beforeEach(() => {
    parts = new FakePartRepository()
    reservations = new FakeReservationRepository()
    useCase = new ReleasePartsUseCase(parts, reservations)
  })

  it('returns reserved stock and marks the reservation released', async () => {
    const part = partWith({ availableQuantity: 7, reservedQuantity: 3 })
    parts.parts.push(part)
    await reservations.create(
      reservationWith({ workOrderId: 'wo-1', items: [{ partId: part.id, quantity: 3 }] }),
    )

    await useCase.execute('wo-1')

    expect(part.availableQuantity).toBe(10)
    expect(part.reservedQuantity).toBe(0)
    expect((await reservations.findByWorkOrderId('wo-1'))?.status).toBe(ReservationStatus.RELEASED)
  })

  it('is a no-op when there is no active reservation', async () => {
    await expect(useCase.execute('missing')).resolves.toBeUndefined()
  })
})
