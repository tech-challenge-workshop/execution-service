import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { InventoryModule } from '../inventory/inventory.module'
import { EXECUTION_REPOSITORY } from './application/ports/execution.repository'
import { StartExecutionUseCase } from './application/use-cases/start-execution.use-case'
import { AddDiagnosticUseCase } from './application/use-cases/add-diagnostic.use-case'
import { StartRepairUseCase } from './application/use-cases/start-repair.use-case'
import { CompleteExecutionUseCase } from './application/use-cases/complete-execution.use-case'
import { FailExecutionUseCase } from './application/use-cases/fail-execution.use-case'
import { GetExecutionUseCase } from './application/use-cases/get-execution.use-case'
import { ListExecutionsUseCase } from './application/use-cases/list-executions.use-case'
import { MongoExecutionRepository } from './infra/mongo-execution.repository'
import { ExecutionDocument, ExecutionSchema } from './infra/execution.schema'
import { ExecutionsController } from './presentation/executions.controller'
import { ExecutionsSagaSubscriber } from './presentation/saga/executions-saga.subscriber'

@Module({
  imports: [
    InventoryModule,
    MongooseModule.forFeature([{ name: ExecutionDocument.name, schema: ExecutionSchema }]),
  ],
  controllers: [ExecutionsController],
  providers: [
    StartExecutionUseCase,
    AddDiagnosticUseCase,
    StartRepairUseCase,
    CompleteExecutionUseCase,
    FailExecutionUseCase,
    GetExecutionUseCase,
    ListExecutionsUseCase,
    ExecutionsSagaSubscriber,
    { provide: EXECUTION_REPOSITORY, useClass: MongoExecutionRepository },
  ],
})
export class ExecutionsModule {}
