import { InvalidPriceError } from '../../../../../src/modules/inventory/domain/errors/inventory.errors'
import { CreatePartUseCase } from '../../../../../src/modules/inventory/application/use-cases/create-part.use-case'
import { FakePartRepository } from '../../part.fixtures'

describe('CreatePartUseCase', () => {
  let repository: FakePartRepository
  let useCase: CreatePartUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new CreatePartUseCase(repository)
  })

  it('persists a valid part and returns the output', async () => {
    const output = await useCase.execute({
      name: 'Brake pad',
      priceCents: 5000,
      initialQuantity: 100,
    })

    expect(repository.parts).toHaveLength(1)
    expect(output).toMatchObject({
      name: 'Brake pad',
      priceCents: 5000,
      availableQuantity: 100,
      reservedQuantity: 0,
    })
  })

  it('propagates domain validation errors without persisting', async () => {
    await expect(
      useCase.execute({ name: 'Brake pad', priceCents: -1, initialQuantity: 100 }),
    ).rejects.toThrow(InvalidPriceError)
    expect(repository.parts).toHaveLength(0)
  })
})
