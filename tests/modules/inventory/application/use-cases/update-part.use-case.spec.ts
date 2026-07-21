import { PartNotFoundError } from '../../../../../src/modules/inventory/domain/errors/inventory.errors'
import { UpdatePartUseCase } from '../../../../../src/modules/inventory/application/use-cases/update-part.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'

describe('UpdatePartUseCase', () => {
  let repository: FakePartRepository
  let useCase: UpdatePartUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new UpdatePartUseCase(repository)
  })

  it('updates fields and persists', async () => {
    const part = partWith()
    repository.parts.push(part)

    const output = await useCase.execute({ id: part.id, name: 'Rear pad', priceCents: 6000 })

    expect(output).toMatchObject({ name: 'Rear pad', priceCents: 6000 })
    expect(repository.updateCalls).toBe(1)
  })

  it('throws PartNotFoundError when missing', async () => {
    await expect(useCase.execute({ id: 'missing-id', name: 'Rear pad' })).rejects.toThrow(
      PartNotFoundError,
    )
  })
})
