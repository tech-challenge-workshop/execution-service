import { ListPartsUseCase } from '../../../../../src/modules/inventory/application/use-cases/list-parts.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'

describe('ListPartsUseCase', () => {
  let repository: FakePartRepository
  let useCase: ListPartsUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new ListPartsUseCase(repository)
  })

  it('returns paginated items ordered by name', async () => {
    repository.parts.push(partWith({ name: 'Oil filter' }), partWith({ name: 'Brake pad' }))

    const output = await useCase.execute({ page: 1, perPage: 1 })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].name).toBe('Brake pad')
    expect(output).toMatchObject({ total: 2, page: 1, perPage: 1 })
  })

  it('filters by search', async () => {
    repository.parts.push(partWith({ name: 'Oil filter' }), partWith({ name: 'Brake pad' }))

    const output = await useCase.execute({ page: 1, perPage: 10, search: 'oil' })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].name).toBe('Oil filter')
  })
})
