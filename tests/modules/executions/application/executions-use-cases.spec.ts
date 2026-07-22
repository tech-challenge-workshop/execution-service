import { ExecutionStatus } from '../../../../src/modules/executions/domain/execution.entity'
import { ExecutionNotFoundError } from '../../../../src/modules/executions/domain/errors/execution.errors'
import { StartExecutionUseCase } from '../../../../src/modules/executions/application/use-cases/start-execution.use-case'
import { AddDiagnosticUseCase } from '../../../../src/modules/executions/application/use-cases/add-diagnostic.use-case'
import { StartRepairUseCase } from '../../../../src/modules/executions/application/use-cases/start-repair.use-case'
import { FailExecutionUseCase } from '../../../../src/modules/executions/application/use-cases/fail-execution.use-case'
import { GetExecutionUseCase } from '../../../../src/modules/executions/application/use-cases/get-execution.use-case'
import { ListExecutionsUseCase } from '../../../../src/modules/executions/application/use-cases/list-executions.use-case'
import { FakeExecutionRepository, executionWith } from '../execution.fixtures'

describe('Execution use cases', () => {
  let repository: FakeExecutionRepository

  beforeEach(() => {
    repository = new FakeExecutionRepository()
  })

  it('starts an execution and is idempotent', async () => {
    const useCase = new StartExecutionUseCase(repository)
    await useCase.execute('wo-1')
    await useCase.execute('wo-1')

    expect(repository.executions.size).toBe(1)
    expect((await repository.findByWorkOrderId('wo-1'))?.status).toBe(ExecutionStatus.QUEUED)
  })

  it('adds a diagnostic and throws when the execution is missing', async () => {
    const execution = executionWith({ workOrderId: 'wo-1' })
    await repository.create(execution)
    const useCase = new AddDiagnosticUseCase(repository)

    const output = await useCase.execute({ workOrderId: 'wo-1', description: 'worn pads' })
    expect(output.diagnostics).toHaveLength(1)

    await expect(useCase.execute({ workOrderId: 'missing', description: 'x' })).rejects.toThrow(
      ExecutionNotFoundError,
    )
  })

  it('starts a repair', async () => {
    await repository.create(
      executionWith({ workOrderId: 'wo-1', status: ExecutionStatus.IN_DIAGNOSIS }),
    )
    const output = await new StartRepairUseCase(repository).execute('wo-1')
    expect(output.status).toBe(ExecutionStatus.IN_REPAIR)
  })

  it('fails an execution', async () => {
    await repository.create(
      executionWith({ workOrderId: 'wo-1', status: ExecutionStatus.IN_REPAIR }),
    )
    const output = await new FailExecutionUseCase(repository).execute('wo-1')
    expect(output.status).toBe(ExecutionStatus.FAILED)
  })

  it('gets an execution or throws when missing', async () => {
    await repository.create(executionWith({ workOrderId: 'wo-1' }))
    expect((await new GetExecutionUseCase(repository).execute('wo-1')).workOrderId).toBe('wo-1')
    await expect(new GetExecutionUseCase(repository).execute('missing')).rejects.toThrow(
      ExecutionNotFoundError,
    )
  })

  it('lists executions filtered by status', async () => {
    await repository.create(executionWith({ workOrderId: 'wo-1', status: ExecutionStatus.QUEUED }))
    await repository.create(
      executionWith({ workOrderId: 'wo-2', status: ExecutionStatus.IN_REPAIR }),
    )

    const all = await new ListExecutionsUseCase(repository).execute({ page: 1, perPage: 10 })
    expect(all.total).toBe(2)

    const inRepair = await new ListExecutionsUseCase(repository).execute({
      page: 1,
      perPage: 10,
      status: ExecutionStatus.IN_REPAIR,
    })
    expect(inRepair.total).toBe(1)
  })
})
