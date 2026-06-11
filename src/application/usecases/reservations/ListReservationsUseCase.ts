import {
  type ReservationRepository,
  type ReservationSearchCriteria,
} from "@application/repositories/ReservationRepository";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

export type ListReservationsInput = {
  userId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  status?: ReservationStatus;
  from?: Date;
  to?: Date;
};

export type ListReservationsOutput = {
  items: {
    id: string;
    resourceType: ResourceType;
    resourceId: string;
    userId: string;
    startAt: Date;
    endAt: Date;
    purpose: string;
    status: ReservationStatus;
    cancelledAt: Date | null;
  }[];
};

export class ListReservationsUseCase {
  public constructor(
    private readonly reservationRepository: ReservationRepository,
  ) {}

  public async execute(
    input: ListReservationsInput = {},
  ): Promise<ListReservationsOutput> {
    const criteria: ReservationSearchCriteria = {
      userId: input.userId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      status: input.status,
      from: input.from,
      to: input.to,
    };
    const reservations = await this.reservationRepository.findAll(criteria);

    return {
      items: reservations.map((reservation) => ({
        id: reservation.id,
        resourceType: reservation.resourceType,
        resourceId: reservation.resourceId,
        userId: reservation.userId,
        startAt: reservation.period.startAt,
        endAt: reservation.period.endAt,
        purpose: reservation.purpose,
        status: reservation.status,
        cancelledAt: reservation.cancelledAt,
      })),
    };
  }
}

