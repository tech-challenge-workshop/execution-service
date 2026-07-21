import { InvalidReservationError } from './errors/reservation.errors'

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED',
  CONSUMED = 'CONSUMED',
}

export interface ReservationItem {
  partId: string
  quantity: number
}

export interface ReservationProps {
  workOrderId: string
  status: ReservationStatus
  items: ReservationItem[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateReservationInput {
  workOrderId: string
  items: ReservationItem[]
}

export class Reservation {
  private constructor(private readonly props: ReservationProps) {}

  static create(input: CreateReservationInput): Reservation {
    if (input.items.length === 0) {
      throw new InvalidReservationError('a reservation must have at least one item')
    }

    const now = new Date()
    return new Reservation({
      workOrderId: input.workOrderId,
      status: ReservationStatus.RESERVED,
      items: input.items,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: ReservationProps): Reservation {
    return new Reservation(props)
  }

  release(): void {
    if (this.props.status === ReservationStatus.RESERVED) {
      this.props.status = ReservationStatus.RELEASED
      this.props.updatedAt = new Date()
    }
  }

  consume(): void {
    if (this.props.status === ReservationStatus.RESERVED) {
      this.props.status = ReservationStatus.CONSUMED
      this.props.updatedAt = new Date()
    }
  }

  get workOrderId(): string {
    return this.props.workOrderId
  }

  get status(): ReservationStatus {
    return this.props.status
  }

  get items(): readonly ReservationItem[] {
    return this.props.items
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get isActive(): boolean {
    return this.props.status === ReservationStatus.RESERVED
  }
}
