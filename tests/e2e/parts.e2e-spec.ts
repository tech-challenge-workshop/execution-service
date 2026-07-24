import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Connection } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'

const MISSING_UUID = '00000000-0000-4000-8000-000000000000'

describe('Parts (e2e)', () => {
  let app: INestApplication<App>
  let connection: Connection
  let bearer: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    )
    await app.init()

    connection = app.get<Connection>(getConnectionToken())
    bearer = `Bearer ${app.get(JwtService).sign({ sub: 'e2e-admin', role: 'admin' })}`
  })

  beforeEach(async () => {
    await connection.collection('parts').deleteMany({})
  })

  afterAll(async () => {
    await connection.collection('parts').deleteMany({})
    await app.close()
  })

  const http = () => {
    const server = app.getHttpServer()
    return {
      get: (url: string) => request(server).get(url).set('Authorization', bearer),
      post: (url: string) => request(server).post(url).set('Authorization', bearer),
      patch: (url: string) => request(server).patch(url).set('Authorization', bearer),
      delete: (url: string) => request(server).delete(url).set('Authorization', bearer),
    }
  }

  async function createPart(payload: Record<string, unknown> = {}): Promise<string> {
    const res = await http()
      .post('/parts')
      .send({ name: 'Brake pad', priceCents: 5000, initialQuantity: 100, ...payload })
      .expect(201)
    return (res.body as { id: string }).id
  }

  describe('POST /parts', () => {
    it('creates a part with stock', async () => {
      const res = await http()
        .post('/parts')
        .send({ name: 'Brake pad', priceCents: 5000, initialQuantity: 100 })
        .expect(201)

      expect(res.body).toMatchObject({
        name: 'Brake pad',
        priceCents: 5000,
        availableQuantity: 100,
        reservedQuantity: 0,
      })
    })

    it('returns 400 for a negative price', async () => {
      await http()
        .post('/parts')
        .send({ name: 'Brake pad', priceCents: -1, initialQuantity: 100 })
        .expect(400)
    })
  })

  describe('GET /parts', () => {
    it('lists parts and filters by search', async () => {
      await createPart({ name: 'Brake pad' })
      await createPart({ name: 'Oil filter' })

      const all = await http().get('/parts').expect(200)
      expect(all.body).toMatchObject({ total: 2 })

      const filtered = await http().get('/parts').query({ search: 'oil' }).expect(200)
      expect(filtered.body).toMatchObject({ total: 1 })
    })

    it('returns price snapshots on the public prices route without a token', async () => {
      const id = await createPart({ name: 'Brake pad', priceCents: 5000 })

      const res = await request(app.getHttpServer())
        .get('/parts/prices')
        .query({ ids: id })
        .expect(200)

      expect(res.body).toEqual([{ partId: id, description: 'Brake pad', unitPriceCents: 5000 }])
    })
  })

  describe('authorization', () => {
    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/parts').expect(401)
    })
  })

  describe('GET /parts/:id', () => {
    it('returns the part', async () => {
      const id = await createPart()
      const res = await http().get(`/parts/${id}`).expect(200)
      expect(res.body).toMatchObject({ id, availableQuantity: 100 })
    })

    it('returns 404 for an unknown id', async () => {
      await http().get(`/parts/${MISSING_UUID}`).expect(404)
    })
  })

  describe('PATCH /parts/:id and restock', () => {
    it('updates catalog fields', async () => {
      const id = await createPart()
      const res = await http()
        .patch(`/parts/${id}`)
        .send({ name: 'Rear pad', priceCents: 6000 })
        .expect(200)
      expect(res.body).toMatchObject({ id, name: 'Rear pad', priceCents: 6000 })
    })

    it('adds stock via restock', async () => {
      const id = await createPart({ initialQuantity: 5 })
      const res = await http().post(`/parts/${id}/restock`).send({ quantity: 10 }).expect(201)
      expect(res.body).toMatchObject({ availableQuantity: 15 })
    })
  })

  describe('DELETE /parts/:id', () => {
    it('soft-deletes and the part stops being readable', async () => {
      const id = await createPart()
      await http().delete(`/parts/${id}`).expect(204)
      await http().get(`/parts/${id}`).expect(404)
    })
  })
})
