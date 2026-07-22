import { InventorySagaSubscriber } from '../../../src/modules/inventory/presentation/saga/inventory-saga.subscriber'
import { ReservePartsUseCase } from '../../../src/modules/inventory/application/use-cases/reserve-parts.use-case'
import { ReleasePartsUseCase } from '../../../src/modules/inventory/application/use-cases/release-parts.use-case'
import { SagaMessage } from '../../../src/shared/messaging/saga-messages'
import type { MessageBus, MessageHandler } from '../../../src/shared/messaging/message-bus'

class CapturingBus implements MessageBus {
  handlers = new Map<string, MessageHandler>()
  published: string[] = []

  publish(routingKey: string): Promise<void> {
    this.published.push(routingKey)
    return Promise.resolve()
  }

  subscribe(routingKey: string, handler: MessageHandler): void {
    this.handlers.set(routingKey, handler)
  }
}

describe('InventorySagaSubscriber', () => {
  let bus: CapturingBus
  let reserve: jest.Mock
  let release: jest.Mock

  function setup(): void {
    bus = new CapturingBus()
    reserve = jest.fn().mockResolvedValue(undefined)
    release = jest.fn().mockResolvedValue(undefined)

    new InventorySagaSubscriber(
      bus,
      { execute: reserve } as unknown as ReservePartsUseCase,
      { execute: release } as unknown as ReleasePartsUseCase,
    ).onModuleInit()
  }

  beforeEach(setup)

  it('reserves parts and replies parts.reserved on success', async () => {
    await bus.handlers.get(SagaMessage.ReserveParts)!({
      workOrderId: 'wo-1',
      parts: [{ partId: 'p-1', quantity: 2 }],
    })

    expect(reserve).toHaveBeenCalledWith({
      workOrderId: 'wo-1',
      items: [{ partId: 'p-1', quantity: 2 }],
    })
    expect(bus.published).toContain(SagaMessage.PartsReserved)
  })

  it('replies parts.reservation-failed when reservation throws', async () => {
    reserve.mockRejectedValueOnce(new Error('insufficient'))

    await bus.handlers.get(SagaMessage.ReserveParts)!({ workOrderId: 'wo-1', parts: [] })

    expect(bus.published).toContain(SagaMessage.PartsReservationFailed)
  })

  it('releases parts on the release command', async () => {
    await bus.handlers.get(SagaMessage.ReleaseParts)!({ workOrderId: 'wo-1' })
    expect(release).toHaveBeenCalledWith('wo-1')
  })
})
