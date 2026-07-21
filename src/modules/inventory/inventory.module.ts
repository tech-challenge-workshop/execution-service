import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PART_REPOSITORY } from './application/ports/part.repository'
import { RESERVATION_REPOSITORY } from './application/ports/reservation.repository'
import { CreatePartUseCase } from './application/use-cases/create-part.use-case'
import { DeletePartUseCase } from './application/use-cases/delete-part.use-case'
import { GetPartUseCase } from './application/use-cases/get-part.use-case'
import { GetPartPricesUseCase } from './application/use-cases/get-part-prices.use-case'
import { ListPartsUseCase } from './application/use-cases/list-parts.use-case'
import { RestockPartUseCase } from './application/use-cases/restock-part.use-case'
import { UpdatePartUseCase } from './application/use-cases/update-part.use-case'
import { ReservePartsUseCase } from './application/use-cases/reserve-parts.use-case'
import { ReleasePartsUseCase } from './application/use-cases/release-parts.use-case'
import { ConsumePartsUseCase } from './application/use-cases/consume-parts.use-case'
import { MongoPartRepository } from './infra/mongo-part.repository'
import { MongoReservationRepository } from './infra/mongo-reservation.repository'
import { PartDocument, PartSchema } from './infra/part.schema'
import { ReservationDocument, ReservationSchema } from './infra/reservation.schema'
import { PartsController } from './presentation/parts.controller'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartDocument.name, schema: PartSchema },
      { name: ReservationDocument.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [PartsController],
  providers: [
    CreatePartUseCase,
    GetPartUseCase,
    GetPartPricesUseCase,
    ListPartsUseCase,
    UpdatePartUseCase,
    RestockPartUseCase,
    DeletePartUseCase,
    ReservePartsUseCase,
    ReleasePartsUseCase,
    ConsumePartsUseCase,
    { provide: PART_REPOSITORY, useClass: MongoPartRepository },
    { provide: RESERVATION_REPOSITORY, useClass: MongoReservationRepository },
  ],
  exports: [
    PART_REPOSITORY,
    RESERVATION_REPOSITORY,
    ReservePartsUseCase,
    ReleasePartsUseCase,
    ConsumePartsUseCase,
  ],
})
export class InventoryModule {}
