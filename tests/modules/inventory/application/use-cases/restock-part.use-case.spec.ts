import { PartNotFoundError } from '../../../../../src/modules/inventory/domain/errors/inventory.errors'
import { RestockPartUseCase } from '../../../../../src/modules/inventory/application/use-cases/restock-part.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'

describe('RestockPartUseCase', () => {
  let repository: FakePartRepository
  let useCase: RestockPartUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new RestockPartUseCase(repository)
  })

  it('adds available quantity and persists', async () => {
    const part = partWith({ availableQuantity: 5 })
    repository.parts.push(part)

    const output = await useCase.execute({ id: part.id, quantity: 10 })

    expect(output.availableQuantity).toBe(15)
    expect(repository.updateCalls).toBe(1)
  })

  it('throws PartNotFoundError when missing', async () => {
    await expect(useCase.execute({ id: 'missing-id', quantity: 10 })).rejects.toThrow(
      PartNotFoundError,
    )
  })
})
