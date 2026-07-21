import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { MESSAGE_BUS } from '../../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import type {
  ReservePartsPayload,
  WorkOrderRefPayload,
} from '../../../../shared/messaging/saga-messages'
import { ReservePartsUseCase } from '../../application/use-cases/reserve-parts.use-case'
import { ReleasePartsUseCase } from '../../application/use-cases/release-parts.use-case'
import { ConsumePartsUseCase } from '../../application/use-cases/consume-parts.use-case'

@Injectable()
export class InventorySagaSubscriber implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
    private readonly reserveParts: ReservePartsUseCase,
    private readonly releaseParts: ReleasePartsUseCase,
    private readonly consumeParts: ConsumePartsUseCase,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(SagaMessage.ReserveParts, (payload) => this.onReserveParts(payload))
    this.bus.subscribe(SagaMessage.ReleaseParts, (payload) => this.onReleaseParts(payload))
    this.bus.subscribe(SagaMessage.StartExecution, (payload) => this.onStartExecution(payload))
  }

  private async onReserveParts(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId, parts } = payload as unknown as ReservePartsPayload
    try {
      await this.reserveParts.execute({ workOrderId, items: parts ?? [] })
      await this.bus.publish(SagaMessage.PartsReserved, { workOrderId })
    } catch {
      await this.bus.publish(SagaMessage.PartsReservationFailed, { workOrderId })
    }
  }

  private async onReleaseParts(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.releaseParts.execute(workOrderId)
  }

  private async onStartExecution(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.consumeParts.execute(workOrderId)
    await this.bus.publish(SagaMessage.ExecutionCompleted, { workOrderId })
  }
}
