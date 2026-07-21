import { validateEnv } from '../../../src/shared/config/env'

describe('validateEnv', () => {
  it('parses a valid environment applying defaults', () => {
    const env = validateEnv({
      MONGODB_URL: 'mongodb://localhost:27017/execution',
      RABBITMQ_URL: 'amqp://localhost:5672',
      JWT_SECRET: 'secret',
    })

    expect(env.PORT).toBe(3002)
    expect(env.RABBITMQ_QUEUE).toBe('execution_queue')
    expect(env.NODE_ENV).toBe('development')
  })

  it('throws when required variables are missing', () => {
    expect(() => validateEnv({})).toThrow('Invalid environment variables')
  })
})
