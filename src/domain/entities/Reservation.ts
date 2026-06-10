import { DomainError } from "../errors/DomainError";
import { ReservationPeriod } from "../valueObjects/ReservationPeriod";
import { ReservationStatus } from "../valueObjects/ReservationStatus";
import { type ResourceType, isResourceType } from "../valueObjects/ResourceType";

type ReservationProps = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  period: ReservationPeriod;
  purpose: string;
  status: ReservationStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class InvalidReservationError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_RESERVATION");
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

export class Reservation {
  // Entity は予約 ID で同一性を判断します。
  private constructor(private readonly props: ReservationProps) {}

  public static create(props: ReservationProps): Reservation {
    const purpose = props.purpose.trim();

    if (props.id.trim().length === 0) {
      throw new InvalidReservationError("id is required.");
    }

    if (!isResourceType(props.resourceType)) {
      throw new InvalidReservationError("resourceType is invalid.");
    }

    if (props.resourceId.trim().length === 0) {
      throw new InvalidReservationError("resourceId is required.");
    }

    if (props.userId.trim().length === 0) {
      throw new InvalidReservationError("userId is required.");
    }

    if (purpose.length === 0 || purpose.length > 200) {
      throw new InvalidReservationError(
        "purpose must be between 1 and 200 characters.",
      );
    }

    if (props.status === ReservationStatus.Reserved && props.cancelledAt !== null) {
      throw new InvalidReservationError(
        "reserved reservation cannot have cancelledAt.",
      );
    }

    if (props.status === ReservationStatus.Cancelled) {
      if (props.cancelledAt === null) {
        throw new InvalidReservationError(
          "cancelled reservation must have cancelledAt.",
        );
      }

      if (!Reservation.isValidDate(props.cancelledAt)) {
        throw new InvalidReservationError("cancelledAt must be a valid date.");
      }
    }

    if (!Reservation.isValidDate(props.createdAt)) {
      throw new InvalidReservationError("createdAt must be a valid date.");
    }

    if (!Reservation.isValidDate(props.updatedAt)) {
      throw new InvalidReservationError("updatedAt must be a valid date.");
    }

    return new Reservation({
      ...props,
      purpose,
      cancelledAt:
        props.cancelledAt === null
          ? null
          : Reservation.cloneDate(props.cancelledAt),
      // Date は mutable なので、Entity の外から変更されないよう clone します。
      createdAt: Reservation.cloneDate(props.createdAt),
      updatedAt: Reservation.cloneDate(props.updatedAt),
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get resourceType(): ResourceType {
    return this.props.resourceType;
  }

  public get resourceId(): string {
    return this.props.resourceId;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get period(): ReservationPeriod {
    return this.props.period;
  }

  public get purpose(): string {
    return this.props.purpose;
  }

  public get status(): ReservationStatus {
    return this.props.status;
  }

  public get cancelledAt(): Date | null {
    if (this.props.cancelledAt === null) {
      return null;
    }

    return Reservation.cloneDate(this.props.cancelledAt);
  }

  public get createdAt(): Date {
    return Reservation.cloneDate(this.props.createdAt);
  }

  public get updatedAt(): Date {
    return Reservation.cloneDate(this.props.updatedAt);
  }

  public isReserved(): boolean {
    return this.status === ReservationStatus.Reserved;
  }

  public isCancelled(): boolean {
    return this.status === ReservationStatus.Cancelled;
  }

  public cancel(cancelledByUserId: string, cancelledAt: Date): Reservation {
    if (cancelledByUserId !== this.userId) {
      throw new ReservationCancellationForbiddenError();
    }

    if (this.isCancelled()) {
      throw new AlreadyCancelledError();
    }

    if (!Reservation.isValidDate(cancelledAt)) {
      throw new InvalidReservationError("cancelledAt must be a valid date.");
    }

    if (this.period.isStartedAtOrBefore(cancelledAt)) {
      throw new CannotCancelPastReservationError();
    }

    return Reservation.create({
      ...this.props,
      status: ReservationStatus.Cancelled,
      cancelledAt,
      updatedAt: cancelledAt,
    });
  }

  public equals(other: Reservation): boolean {
    return this.id === other.id;
  }

  private static isValidDate(date: Date): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  private static cloneDate(date: Date): Date {
    return new Date(date.getTime());
  }
}

