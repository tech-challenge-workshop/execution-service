import { PartNotFoundError } from '../../../../../src/modules/inventory/domain/errors/inventory.errors'
import { DeletePartUseCase } from '../../../../../src/modules/inventory/application/use-cases/delete-part.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'

describe('DeletePartUseCase', () => {
  let repository: FakePartRepository
  let useCase: DeletePartUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new DeletePartUseCase(repository)
  })

  it('soft-deletes an existing part and persists', async () => {
    const part = partWith()
    repository.parts.push(part)

    await useCase.execute(part.id)

    expect(part.isDeleted).toBe(true)
    expect(repository.updateCalls).toBe(1)
  })

  it('throws PartNotFoundError when missing or already deleted', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(PartNotFoundError)
  })
})
