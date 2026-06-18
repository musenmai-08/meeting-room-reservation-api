import { DomainError } from "./DomainError";

export class InvalidUnavailablePeriodError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_UNAVAILABLE_PERIOD");
  }
}

export class InvalidResourceUnavailablePeriodStatusError extends DomainError {
  public constructor(value: string) {
    super(
      `Invalid resource unavailable period status: ${value}`,
      "INVALID_RESOURCE_UNAVAILABLE_PERIOD_STATUS",
    );
  }
}

export class ResourceUnavailablePeriodAlreadyCancelledError extends DomainError {
  public constructor() {
    super(
      "resource unavailable period is already cancelled.",
      "RESOURCE_UNAVAILABLE_PERIOD_ALREADY_CANCELLED",
    );
  }
}

export class CannotCancelStartedResourceUnavailablePeriodError extends DomainError {
  public constructor() {
    super(
      "resource unavailable period cannot be cancelled after it has started.",
      "CANNOT_CANCEL_STARTED_RESOURCE_UNAVAILABLE_PERIOD",
    );
  }
}
