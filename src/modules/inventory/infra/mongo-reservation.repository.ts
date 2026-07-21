import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { Reservation, ReservationStatus } from '../domain/reservation.entity'
import { ReservationRepository } from '../application/ports/reservation.repository'
import { ReservationDocument } from './reservation.schema'

interface ReservationLean {
  _id: string
  status: string
  items: { partId: string; quantity: number }[]
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class MongoReservationRepository implements ReservationRepository {
  constructor(
    @InjectModel(ReservationDocument.name)
    private readonly model: Model<ReservationDocument>,
  ) {}

  async create(reservation: Reservation): Promise<void> {
    await this.model.create(this.toDocument(reservation))
  }

  async update(reservation: Reservation): Promise<void> {
    const { _id, ...data } = this.toDocument(reservation)
    await this.model.updateOne({ _id }, { $set: data }).exec()
  }

  async findByWorkOrderId(workOrderId: string): Promise<Reservation | null> {
    const row = await this.model.findOne({ _id: workOrderId }).lean<ReservationLean>().exec()
    return row ? this.toEntity(row) : null
  }

  private toDocument(reservation: Reservation): ReservationLean {
    return {
      _id: reservation.workOrderId,
      status: reservation.status,
      items: reservation.items.map((item) => ({ partId: item.partId, quantity: item.quantity })),
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    }
  }

  private toEntity(row: ReservationLean): Reservation {
    return Reservation.restore({
      workOrderId: row._id,
      status: row.status as ReservationStatus,
      items: row.items.map((item) => ({ partId: item.partId, quantity: item.quantity })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
