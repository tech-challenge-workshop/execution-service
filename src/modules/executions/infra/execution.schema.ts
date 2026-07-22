import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ExecutionDocumentType = HydratedDocument<ExecutionDocument>

@Schema({ collection: 'executions', versionKey: false })
export class ExecutionDocument {
  @Prop({ type: String })
  _id!: string

  @Prop({ required: true })
  status!: string

  @Prop({
    type: [{ description: String, details: Object, recordedAt: Date, _id: false }],
    default: [],
  })
  diagnostics!: { description: string; details: Record<string, unknown> | null; recordedAt: Date }[]

  @Prop({ required: true })
  createdAt!: Date

  @Prop({ required: true })
  updatedAt!: Date
}

export const ExecutionSchema = SchemaFactory.createForClass(ExecutionDocument)
