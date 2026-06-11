import { ApplicationError } from "./ApplicationError";

export class ReservationConflictError extends ApplicationError {
  public constructor() {
    super(
      "Reservation time conflicts with an existing reservation.",
      "RESERVATION_CONFLICT",
    );
  }
}

export class ReservationStartAtMustBeFutureError extends ApplicationError {
  public constructor() {
    super(
      "Reservation startAt must be later than now.",
      "RESERVATION_START_AT_MUST_BE_FUTURE",
    );
  }
}

export class ReservationNotFoundError extends ApplicationError {
  public constructor(reservationId: string) {
    super(`Reservation not found: ${reservationId}`, "RESERVATION_NOT_FOUND");
  }
}
