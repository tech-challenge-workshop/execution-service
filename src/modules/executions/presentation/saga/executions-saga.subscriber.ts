import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { MESSAGE_BUS } from '../../../../shared/messaging/message-bus'
import type { MessageBus } from '../../../../shared/messaging/message-bus'
import { SagaMessage } from '../../../../shared/messaging/saga-messages'
import type { WorkOrderRefPayload } from '../../../../shared/messaging/saga-messages'
import { StartExecutionUseCase } from '../../application/use-cases/start-execution.use-case'

@Injectable()
export class ExecutionsSagaSubscriber implements OnModuleInit {
  constructor(
    @Inject(MESSAGE_BUS)
    private readonly bus: MessageBus,
    private readonly startExecution: StartExecutionUseCase,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(SagaMessage.StartExecution, (payload) => this.onStartExecution(payload))
  }

  private async onStartExecution(payload: Record<string, unknown>): Promise<void> {
    const { workOrderId } = payload as unknown as WorkOrderRefPayload
    await this.startExecution.execute(workOrderId)
  }
}
