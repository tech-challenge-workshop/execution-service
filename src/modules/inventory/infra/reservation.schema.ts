import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type ReservationDocumentType = HydratedDocument<ReservationDocument>

@Schema({ collection: 'reservations', versionKey: false })
export class ReservationDocument {
  @Prop({ type: String })
  _id!: string

  @Prop({ required: true })
  status!: string

  @Prop({ type: [{ partId: String, quantity: Number, _id: false }], default: [] })
  items!: { partId: string; quantity: number }[]

  @Prop({ required: true })
  createdAt!: Date

  @Prop({ required: true })
  updatedAt!: Date
}

export const ReservationSchema = SchemaFactory.createForClass(ReservationDocument)
