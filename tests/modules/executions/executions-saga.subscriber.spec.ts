import { ExecutionsSagaSubscriber } from '../../../src/modules/executions/presentation/saga/executions-saga.subscriber'
import { StartExecutionUseCase } from '../../../src/modules/executions/application/use-cases/start-execution.use-case'
import { SagaMessage } from '../../../src/shared/messaging/saga-messages'
import type { MessageBus, MessageHandler } from '../../../src/shared/messaging/message-bus'

class CapturingBus implements MessageBus {
  handlers = new Map<string, MessageHandler>()

  publish(): Promise<void> {
    return Promise.resolve()
  }

  subscribe(routingKey: string, handler: MessageHandler): void {
    this.handlers.set(routingKey, handler)
  }
}

describe('ExecutionsSagaSubscriber', () => {
  it('starts an execution when execution.start is received', async () => {
    const bus = new CapturingBus()
    const start = jest.fn().mockResolvedValue(undefined)

    new ExecutionsSagaSubscriber(bus, {
      execute: start,
    } as unknown as StartExecutionUseCase).onModuleInit()

    await bus.handlers.get(SagaMessage.StartExecution)!({ workOrderId: 'wo-1' })

    expect(start).toHaveBeenCalledWith('wo-1')
  })
})
