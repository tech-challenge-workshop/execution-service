import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PART_REPOSITORY } from './application/ports/part.repository'
import { CreatePartUseCase } from './application/use-cases/create-part.use-case'
import { DeletePartUseCase } from './application/use-cases/delete-part.use-case'
import { GetPartUseCase } from './application/use-cases/get-part.use-case'
import { GetPartPricesUseCase } from './application/use-cases/get-part-prices.use-case'
import { ListPartsUseCase } from './application/use-cases/list-parts.use-case'
import { RestockPartUseCase } from './application/use-cases/restock-part.use-case'
import { UpdatePartUseCase } from './application/use-cases/update-part.use-case'
import { MongoPartRepository } from './infra/mongo-part.repository'
import { PartDocument, PartSchema } from './infra/part.schema'
import { PartsController } from './presentation/parts.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: PartDocument.name, schema: PartSchema }])],
  controllers: [PartsController],
  providers: [
    CreatePartUseCase,
    GetPartUseCase,
    GetPartPricesUseCase,
    ListPartsUseCase,
    UpdatePartUseCase,
    RestockPartUseCase,
    DeletePartUseCase,
    { provide: PART_REPOSITORY, useClass: MongoPartRepository },
  ],
  exports: [PART_REPOSITORY],
})
export class InventoryModule {}
