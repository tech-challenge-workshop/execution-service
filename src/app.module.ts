import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { InventoryModule } from './modules/inventory/inventory.module'
import { validateEnv } from './shared/config/env'
import { DatabaseModule } from './shared/database/database.module'
import { HealthController } from './shared/health/health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    DatabaseModule,
    InventoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
