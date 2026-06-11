import { ReservationNotFoundError } from "@application/errors/ReservationApplicationErrors";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

export type GetReservationInput = {
  reservationId: string;
};

export type GetReservationOutput = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  startAt: Date;
  endAt: Date;
  purpose: string;
  status: ReservationStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class GetReservationUseCase {
  public constructor(
    private readonly reservationRepository: ReservationRepository,
  ) {}

  public async execute(
    input: GetReservationInput,
  ): Promise<GetReservationOutput> {
    const reservation = await this.reservationRepository.findById(
      input.reservationId,
    );

    if (reservation === null) {
      throw new ReservationNotFoundError(input.reservationId);
    }

    return {
      id: reservation.id,
      resourceType: reservation.resourceType,
      resourceId: reservation.resourceId,
      userId: reservation.userId,
      startAt: reservation.period.startAt,
      endAt: reservation.period.endAt,
      purpose: reservation.purpose,
      status: reservation.status,
      cancelledAt: reservation.cancelledAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}

