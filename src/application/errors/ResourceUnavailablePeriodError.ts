import { ApplicationError } from "./ApplicationError";

export class ResourceUnavailablePeriodStartAtMustBeFutureError extends ApplicationError {
  public constructor() {
    super(
      "ResourceUnavailablePeriod startAt must be later than now.",
      "RESOURCE_UNAVAILABLE_PERIOD_START_AT_MUST_BE_FUTURE",
    );
  }
}

export class ResourceUnavailablePeriodConflictError extends ApplicationError {
  public constructor() {
    super(
      "ResourceUnavailablePeriod time conflicts with an existing ResourceUnavailablePeriod.",
      "RESOURCE_UNAVAILABLE_PERIOD_CONFLICT",
    );
  }
}

export class ResourceUnavailablePeriodReservationConflictError extends ApplicationError {
  public constructor() {
    super(
      "ResourceUnavailablePeriod time conflicts with an existing reservation.",
      "RESOURCE_HAS_ACTIVE_RESERVATION",
    );
  }
}

export class ResourceUnavailablePeriodNotFoundError extends ApplicationError {
  public constructor() {
    super(
      "ResourceUnavailablePeriod not found.",
      "RESOURCE_UNAVAILABLE_PERIOD_NOT_FOUND",
    );
  }
}
