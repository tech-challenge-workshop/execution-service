import { Reservation } from '../../domain/reservation.entity'

export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY')

export interface ReservationRepository {
  create(reservation: Reservation): Promise<void>
  update(reservation: Reservation): Promise<void>
  findByWorkOrderId(workOrderId: string): Promise<Reservation | null>
}
