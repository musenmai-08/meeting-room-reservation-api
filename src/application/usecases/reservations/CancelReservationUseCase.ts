import { ReservationNotFoundError } from "@application/errors/ReservationApplicationErrors";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { Clock } from "@application/services/Clock";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

export type CancelReservationInput = {
  reservationId: string;
  userId: string;
};

export type CancelReservationOutput = {
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

export class CancelReservationUseCase {
  public constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: CancelReservationInput,
  ): Promise<CancelReservationOutput> {
    const reservation = await this.reservationRepository.findById(
      input.reservationId,
    );

    if (reservation === null) {
      throw new ReservationNotFoundError(input.reservationId);
    }

    const cancelledReservation = reservation.cancel(
      input.userId,
      this.clock.now(),
    );

    await this.reservationRepository.save(cancelledReservation);

    return {
      id: cancelledReservation.id,
      resourceType: cancelledReservation.resourceType,
      resourceId: cancelledReservation.resourceId,
      userId: cancelledReservation.userId,
      startAt: cancelledReservation.period.startAt,
      endAt: cancelledReservation.period.endAt,
      purpose: cancelledReservation.purpose,
      status: cancelledReservation.status,
      cancelledAt: cancelledReservation.cancelledAt,
      createdAt: cancelledReservation.createdAt,
      updatedAt: cancelledReservation.updatedAt,
    };
  }
}

