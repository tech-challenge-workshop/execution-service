import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Connection } from 'mongoose'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'

const WO = '390a5b7c-2222-4abc-8def-000000000002'
const MISSING = '00000000-0000-4000-8000-000000000000'

describe('Executions (e2e)', () => {
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
    await connection.collection('executions').deleteMany({})
  })

  afterAll(async () => {
    await connection.collection('executions').deleteMany({})
    await app.close()
  })

  const http = () => {
    const server = app.getHttpServer()
    return {
      get: (url: string) => request(server).get(url).set('Authorization', bearer),
      post: (url: string) => request(server).post(url).set('Authorization', bearer),
    }
  }

  async function seedQueued(): Promise<void> {
    const now = new Date()
    await connection
      .collection('executions')
      .insertOne({ _id: WO, status: 'QUEUED', diagnostics: [], createdAt: now, updatedAt: now })
  }

  it('drives an execution from queued to completed with a diagnostic', async () => {
    await seedQueued()

    const queued = await http().get(`/executions/${WO}`).expect(200)
    expect(queued.body).toMatchObject({ workOrderId: WO, status: 'QUEUED' })

    const diagnosed = await http()
      .post(`/executions/${WO}/diagnostics`)
      .send({ description: 'worn pads', details: { padMm: 1.5 } })
      .expect(201)
    expect(diagnosed.body).toMatchObject({ status: 'IN_DIAGNOSIS' })
    expect((diagnosed.body as { diagnostics: unknown[] }).diagnostics).toHaveLength(1)

    await http().post(`/executions/${WO}/start-repair`).expect(201)

    const completed = await http().post(`/executions/${WO}/complete`).expect(201)
    expect(completed.body).toMatchObject({ status: 'COMPLETED' })
  })

  it('lists the execution queue and filters by status', async () => {
    await seedQueued()

    const all = await http().get('/executions').expect(200)
    expect(all.body).toMatchObject({ total: 1 })

    const inRepair = await http().get('/executions').query({ status: 'IN_REPAIR' }).expect(200)
    expect(inRepair.body).toMatchObject({ total: 0 })
  })

  it('returns 404 for an unknown execution', async () => {
    await http().get(`/executions/${MISSING}`).expect(404)
  })

  it('returns 400 when completing from an invalid state', async () => {
    await seedQueued()
    await http().post(`/executions/${WO}/complete`).expect(400)
  })

  it('fails an execution', async () => {
    await seedQueued()
    const failed = await http().post(`/executions/${WO}/fail`).expect(201)
    expect(failed.body).toMatchObject({ status: 'FAILED' })
  })
})
