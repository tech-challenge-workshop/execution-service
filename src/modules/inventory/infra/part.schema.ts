import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type PartDocumentType = HydratedDocument<PartDocument>

@Schema({ collection: 'parts', versionKey: false })
export class PartDocument {
  @Prop({ type: String })
  _id!: string

  @Prop({ required: true })
  name!: string

  @Prop({ type: String, default: null })
  description!: string | null

  @Prop({ required: true })
  priceCents!: number

  @Prop({ required: true })
  availableQuantity!: number

  @Prop({ required: true })
  reservedQuantity!: number

  @Prop({ required: true })
  createdAt!: Date

  @Prop({ required: true })
  updatedAt!: Date

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null
}

export const PartSchema = SchemaFactory.createForClass(PartDocument)
