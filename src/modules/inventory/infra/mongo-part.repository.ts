import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { Part } from '../domain/part.entity'
import { Money } from '../domain/value-objects/money'
import { PartRepository } from '../application/ports/part.repository'
import type { ListPartsParams, PaginatedParts } from '../application/ports/part.repository'
import { PartDocument } from './part.schema'

interface PartLean {
  _id: string
  name: string
  description: string | null
  priceCents: number
  availableQuantity: number
  reservedQuantity: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

@Injectable()
export class MongoPartRepository implements PartRepository {
  constructor(
    @InjectModel(PartDocument.name)
    private readonly model: Model<PartDocument>,
  ) {}

  async create(part: Part): Promise<void> {
    await this.model.create(this.toDocument(part))
  }

  async update(part: Part): Promise<void> {
    const { _id, ...data } = this.toDocument(part)
    await this.model.updateOne({ _id }, { $set: data }).exec()
  }

  async findById(id: string): Promise<Part | null> {
    const row = await this.model.findOne({ _id: id, deletedAt: null }).lean<PartLean>().exec()
    return row ? this.toEntity(row) : null
  }

  async findByIds(ids: string[]): Promise<Part[]> {
    const rows = await this.model
      .find({ _id: { $in: ids }, deletedAt: null })
      .lean<PartLean[]>()
      .exec()
    return rows.map((row) => this.toEntity(row))
  }

  async list(params: ListPartsParams): Promise<PaginatedParts> {
    const filter = {
      deletedAt: null,
      ...(params.search ? { name: { $regex: params.search, $options: 'i' } } : {}),
    }

    const [rows, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ name: 1 })
        .skip((params.page - 1) * params.perPage)
        .limit(params.perPage)
        .lean<PartLean[]>()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ])

    return { items: rows.map((row) => this.toEntity(row)), total }
  }

  private toDocument(part: Part): PartLean {
    return {
      _id: part.id,
      name: part.name,
      description: part.description,
      priceCents: part.price.cents,
      availableQuantity: part.availableQuantity,
      reservedQuantity: part.reservedQuantity,
      createdAt: part.createdAt,
      updatedAt: part.updatedAt,
      deletedAt: part.deletedAt,
    }
  }

  private toEntity(row: PartLean): Part {
    return Part.restore({
      id: row._id,
      name: row.name,
      description: row.description,
      price: Money.fromCents(row.priceCents),
      availableQuantity: row.availableQuantity,
      reservedQuantity: row.reservedQuantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    })
  }
}
