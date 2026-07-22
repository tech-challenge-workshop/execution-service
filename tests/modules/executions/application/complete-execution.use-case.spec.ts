import { ExecutionStatus } from '../../../../src/modules/executions/domain/execution.entity'
import { ExecutionNotFoundError } from '../../../../src/modules/executions/domain/errors/execution.errors'
import { ConsumePartsUseCase } from '../../../../src/modules/inventory/application/use-cases/consume-parts.use-case'
import { CompleteExecutionUseCase } from '../../../../src/modules/executions/application/use-cases/complete-execution.use-case'
import { FakeExecutionRepository, executionWith } from '../execution.fixtures'

describe('CompleteExecutionUseCase', () => {
  let repository: FakeExecutionRepository
  let consume: jest.Mock
  let useCase: CompleteExecutionUseCase

  beforeEach(() => {
    repository = new FakeExecutionRepository()
    consume = jest.fn().mockResolvedValue(undefined)
    useCase = new CompleteExecutionUseCase(repository, {
      execute: consume,
    } as unknown as ConsumePartsUseCase)
  })

  it('completes the execution and consumes the reserved parts', async () => {
    await repository.create(
      executionWith({ workOrderId: 'wo-1', status: ExecutionStatus.IN_REPAIR }),
    )

    const output = await useCase.execute('wo-1')

    expect(output.status).toBe(ExecutionStatus.COMPLETED)
    expect(consume).toHaveBeenCalledWith('wo-1')
  })

  it('throws when the execution is missing', async () => {
    await expect(useCase.execute('missing')).rejects.toThrow(ExecutionNotFoundError)
    expect(consume).not.toHaveBeenCalled()
  })
})
