import {
  type ReservationRepository,
  type ReservationResourceCriteria,
  type ReservationSearchCriteria,
} from "@application/repositories/ReservationRepository";
import { Reservation } from "@domain/entities/Reservation";

export class InMemoryReservationRepository implements ReservationRepository {
  private readonly reservations = new Map<string, Reservation>();

  public async save(reservation: Reservation): Promise<void> {
    this.reservations.set(reservation.id, reservation);
  }

  public async findById(id: string): Promise<Reservation | null> {
    return this.reservations.get(id) ?? null;
  }

  public async findAll(
    criteria: ReservationSearchCriteria = {},
  ): Promise<Reservation[]> {
    return [...this.reservations.values()].filter((reservation) =>
      this.matchesSearchCriteria(reservation, criteria),
    );
  }

  public async findByResource(
    criteria: ReservationResourceCriteria,
  ): Promise<Reservation[]> {
    return [...this.reservations.values()].filter(
      (reservation) =>
        reservation.resourceType === criteria.resourceType &&
        reservation.resourceId === criteria.resourceId &&
        this.matchesPeriodCriteria(reservation, criteria),
    );
  }

  private matchesSearchCriteria(
    reservation: Reservation,
    criteria: ReservationSearchCriteria,
  ): boolean {
    if (criteria.userId !== undefined && reservation.userId !== criteria.userId) {
      return false;
    }

    if (
      criteria.resourceType !== undefined &&
      reservation.resourceType !== criteria.resourceType
    ) {
      return false;
    }

    if (
      criteria.resourceId !== undefined &&
      reservation.resourceId !== criteria.resourceId
    ) {
      return false;
    }

    if (criteria.status !== undefined && reservation.status !== criteria.status) {
      return false;
    }

    return this.matchesPeriodCriteria(reservation, criteria);
  }

  private matchesPeriodCriteria(
    reservation: Reservation,
    criteria: { from?: Date; to?: Date },
  ): boolean {
    if (
      criteria.from !== undefined &&
      reservation.period.startAt.getTime() < criteria.from.getTime()
    ) {
      return false;
    }

    if (
      criteria.to !== undefined &&
      reservation.period.endAt.getTime() > criteria.to.getTime()
    ) {
      return false;
    }

    return true;
  }
}

