import { DomainError } from "./DomainError";

export class InvalidReservationError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_RESERVATION");
  }
}

export class InvalidReservationPeriodError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_RESERVATION_PERIOD");
  }
}

export class InvalidReservationStatusError extends DomainError {
  public constructor(value: string) {
    super(`Invalid reservation status: ${value}`, "INVALID_RESERVATION_STATUS");
  }
}

export class AlreadyCancelledError extends DomainError {
  public constructor() {
    super("reservation is already cancelled.", "ALREADY_CANCELLED");
  }
}

export class CannotCancelPastReservationError extends DomainError {
  public constructor() {
    super(
      "reservation cannot be cancelled after it has started.",
      "CANNOT_CANCEL_PAST_RESERVATION",
    );
  }
}

export class ReservationCancellationForbiddenError extends DomainError {
  public constructor() {
    super(
      "only the reservation owner can cancel this reservation.",
      "RESERVATION_CANCELLATION_FORBIDDEN",
    );
  }
}
