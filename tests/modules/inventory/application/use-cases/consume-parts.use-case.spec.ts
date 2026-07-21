import { ReservationStatus } from '../../../../../src/modules/inventory/domain/reservation.entity'
import { ConsumePartsUseCase } from '../../../../../src/modules/inventory/application/use-cases/consume-parts.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'
import { FakeReservationRepository, reservationWith } from '../../reservation.fixtures'

describe('ConsumePartsUseCase', () => {
  let parts: FakePartRepository
  let reservations: FakeReservationRepository
  let useCase: ConsumePartsUseCase

  beforeEach(() => {
    parts = new FakePartRepository()
    reservations = new FakeReservationRepository()
    useCase = new ConsumePartsUseCase(parts, reservations)
  })

  it('removes reserved stock without returning it and marks the reservation consumed', async () => {
    const part = partWith({ availableQuantity: 7, reservedQuantity: 3 })
    parts.parts.push(part)
    await reservations.create(
      reservationWith({ workOrderId: 'wo-1', items: [{ partId: part.id, quantity: 3 }] }),
    )

    await useCase.execute('wo-1')

    expect(part.reservedQuantity).toBe(0)
    expect(part.availableQuantity).toBe(7)
    expect((await reservations.findByWorkOrderId('wo-1'))?.status).toBe(ReservationStatus.CONSUMED)
  })

  it('is a no-op when there is no active reservation', async () => {
    await expect(useCase.execute('missing')).resolves.toBeUndefined()
  })
})
