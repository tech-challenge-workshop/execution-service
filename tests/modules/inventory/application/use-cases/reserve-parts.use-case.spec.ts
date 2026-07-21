import {
  InsufficientStockError,
  PartNotFoundError,
} from '../../../../../src/modules/inventory/domain/errors/inventory.errors'
import { ReservePartsUseCase } from '../../../../../src/modules/inventory/application/use-cases/reserve-parts.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'
import { FakeReservationRepository } from '../../reservation.fixtures'

describe('ReservePartsUseCase', () => {
  let parts: FakePartRepository
  let reservations: FakeReservationRepository
  let useCase: ReservePartsUseCase

  beforeEach(() => {
    parts = new FakePartRepository()
    reservations = new FakeReservationRepository()
    useCase = new ReservePartsUseCase(parts, reservations)
  })

  it('reserves all parts and records the reservation', async () => {
    const part = partWith({ availableQuantity: 10, reservedQuantity: 0 })
    parts.parts.push(part)

    await useCase.execute({ workOrderId: 'wo-1', items: [{ partId: part.id, quantity: 3 }] })

    expect(part.availableQuantity).toBe(7)
    expect(part.reservedQuantity).toBe(3)
    expect(await reservations.findByWorkOrderId('wo-1')).not.toBeNull()
  })

  it('fails without reserving anything when a part is insufficient', async () => {
    const ok = partWith({ availableQuantity: 10 })
    const low = partWith({ availableQuantity: 1 })
    parts.parts.push(ok, low)

    await expect(
      useCase.execute({
        workOrderId: 'wo-1',
        items: [
          { partId: ok.id, quantity: 2 },
          { partId: low.id, quantity: 5 },
        ],
      }),
    ).rejects.toThrow(InsufficientStockError)

    expect(ok.reservedQuantity).toBe(0)
    expect(await reservations.findByWorkOrderId('wo-1')).toBeNull()
  })

  it('fails when a part does not exist', async () => {
    await expect(
      useCase.execute({ workOrderId: 'wo-1', items: [{ partId: 'missing', quantity: 1 }] }),
    ).rejects.toThrow(PartNotFoundError)
  })

  it('is idempotent when a reservation already exists', async () => {
    const part = partWith({ availableQuantity: 10 })
    parts.parts.push(part)
    await useCase.execute({ workOrderId: 'wo-1', items: [{ partId: part.id, quantity: 3 }] })

    await useCase.execute({ workOrderId: 'wo-1', items: [{ partId: part.id, quantity: 3 }] })

    expect(part.availableQuantity).toBe(7)
  })

  it('succeeds as a no-op when there are no parts to reserve', async () => {
    await useCase.execute({ workOrderId: 'wo-1', items: [] })

    expect(await reservations.findByWorkOrderId('wo-1')).toBeNull()
  })
})
