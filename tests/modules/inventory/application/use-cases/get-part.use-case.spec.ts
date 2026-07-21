import { PartNotFoundError } from '../../../../../src/modules/inventory/domain/errors/inventory.errors'
import { GetPartUseCase } from '../../../../../src/modules/inventory/application/use-cases/get-part.use-case'
import { FakePartRepository, partWith } from '../../part.fixtures'

describe('GetPartUseCase', () => {
  let repository: FakePartRepository
  let useCase: GetPartUseCase

  beforeEach(() => {
    repository = new FakePartRepository()
    useCase = new GetPartUseCase(repository)
  })

  it('returns the part output when found', async () => {
    const part = partWith()
    repository.parts.push(part)

    const output = await useCase.execute(part.id)

    expect(output).toMatchObject({ id: part.id, name: 'Brake pad', priceCents: 5000 })
  })

  it('throws PartNotFoundError when missing or deleted', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(PartNotFoundError)

    const deleted = partWith({ deletedAt: new Date('2026-01-02T00:00:00Z') })
    repository.parts.push(deleted)
    await expect(useCase.execute(deleted.id)).rejects.toThrow(PartNotFoundError)
  })
})
