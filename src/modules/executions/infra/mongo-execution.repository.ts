import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import type { Model } from 'mongoose'
import { Execution, ExecutionStatus } from '../domain/execution.entity'
import { ExecutionRepository } from '../application/ports/execution.repository'
import type {
  ListExecutionsParams,
  PaginatedExecutions,
} from '../application/ports/execution.repository'
import { ExecutionDocument } from './execution.schema'

interface ExecutionLean {
  _id: string
  status: string
  diagnostics: { description: string; details: Record<string, unknown> | null; recordedAt: Date }[]
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class MongoExecutionRepository implements ExecutionRepository {
  constructor(
    @InjectModel(ExecutionDocument.name)
    private readonly model: Model<ExecutionDocument>,
  ) {}

  async create(execution: Execution): Promise<void> {
    await this.model.create(this.toDocument(execution))
  }

  async update(execution: Execution): Promise<void> {
    const { _id, ...data } = this.toDocument(execution)
    await this.model.updateOne({ _id }, { $set: data }).exec()
  }

  async findByWorkOrderId(workOrderId: string): Promise<Execution | null> {
    const row = await this.model.findOne({ _id: workOrderId }).lean<ExecutionLean>().exec()
    return row ? this.toEntity(row) : null
  }

  async list(params: ListExecutionsParams): Promise<PaginatedExecutions> {
    const filter = params.status ? { status: params.status } : {}

    const [rows, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: 1 })
        .skip((params.page - 1) * params.perPage)
        .limit(params.perPage)
        .lean<ExecutionLean[]>()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ])

    return { items: rows.map((row) => this.toEntity(row)), total }
  }

  private toDocument(execution: Execution): ExecutionLean {
    return {
      _id: execution.workOrderId,
      status: execution.status,
      diagnostics: execution.diagnostics.map((entry) => ({
        description: entry.description,
        details: entry.details,
        recordedAt: entry.recordedAt,
      })),
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    }
  }

  private toEntity(row: ExecutionLean): Execution {
    return Execution.restore({
      workOrderId: row._id,
      status: row.status as ExecutionStatus,
      diagnostics: row.diagnostics.map((entry) => ({
        description: entry.description,
        details: entry.details,
        recordedAt: entry.recordedAt,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
