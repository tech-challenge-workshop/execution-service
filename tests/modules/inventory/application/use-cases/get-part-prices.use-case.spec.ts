import { GetPartPricesUseCase } from '../../../../../src/modules/inventory/application/use-cases/get-part-prices.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'

describe('GetPartPricesUseCase', () => {
  let repository: FakePartRepository
  let useCase: GetPartPricesUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new GetPartPricesUseCase(repository)
  })

  it('returns price snapshots for the requested ids', async () => {
    const part = partWith({ name: 'Brake pad' })
    repository.parts.push(part)

    const output = await useCase.execute([part.id])

    expect(output).toEqual([{ partId: part.id, description: 'Brake pad', unitPriceCents: 5000 }])
  })

  it('returns an empty array for no ids', async () => {
    expect(await useCase.execute([])).toEqual([])
  })
})
