import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { InventoryModule } from './modules/inventory/inventory.module'
import { ExecutionsModule } from './modules/executions/executions.module'
import { validateEnv } from './shared/config/env'
import { DatabaseModule } from './shared/database/database.module'
import { HealthController } from './shared/health/health.controller'
import { MessagingModule } from './shared/messaging/messaging.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MessagingModule,
    DatabaseModule,
    InventoryModule,
    ExecutionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
