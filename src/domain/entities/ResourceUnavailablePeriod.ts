import {
  CannotCancelStartedResourceUnavailablePeriodError,
  InvalidUnavailablePeriodError,
  ResourceUnavailablePeriodAlreadyCancelledError,
} from "@domain/errors/ResourceUnavailablePeriodErrors";
import {
  isResourceType,
  type ResourceType,
} from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";

type ResourceUnavailablePeriodProps = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  operatorId: string;
  period: UnavailablePeriod;
  reason: string;
  status: ResourceUnavailablePeriodStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ResourceUnavailablePeriod {
  private constructor(private readonly props: ResourceUnavailablePeriodProps) {}

  public static create(
    props: ResourceUnavailablePeriodProps,
  ): ResourceUnavailablePeriod {
    const reason = props.reason.trim();

    // オブジェクトを作る時の確認事項
    if (props.id.trim().length === 0) {
      throw new InvalidUnavailablePeriodError("id is required");
    }

    if (!isResourceType(props.resourceType)) {
      throw new InvalidUnavailablePeriodError("resourceType is invalid.");
    }

    if (props.resourceId.trim().length === 0) {
      throw new InvalidUnavailablePeriodError("resourceId is required.");
    }

    if (props.operatorId.trim().length === 0) {
      throw new InvalidUnavailablePeriodError("operatorId is required.");
    }

    if (reason.length === 0 || reason.length > 200) {
      throw new InvalidUnavailablePeriodError(
        "reason must be between 1 and 200 characters.",
      );
    }

    if (
      props.status === ResourceUnavailablePeriodStatus.Active &&
      props.cancelledAt !== null
    ) {
      throw new InvalidUnavailablePeriodError(
        "cancelledAt must be null when status is Active.",
      );
    }

    if (props.status === ResourceUnavailablePeriodStatus.Cancelled) {
      if (props.cancelledAt === null) {
        throw new InvalidUnavailablePeriodError(
          "cancelledAt is required when status is Cancelled.",
        );
      }

      if (!ResourceUnavailablePeriod.isValidDate(props.cancelledAt)) {
        throw new InvalidUnavailablePeriodError(
          "cancelledAt must be a valid date.",
        );
      }
    }

    if (!ResourceUnavailablePeriod.isValidDate(props.createdAt)) {
      throw new InvalidUnavailablePeriodError(
        "createdAt must be a valid date.",
      );
    }

    if (!ResourceUnavailablePeriod.isValidDate(props.updatedAt)) {
      throw new InvalidUnavailablePeriodError(
        "updatedAt must be a valid date.",
      );
    }

    return new ResourceUnavailablePeriod({
      ...props,
      reason,
      cancelledAt:
        props.cancelledAt === null
          ? null
          : ResourceUnavailablePeriod.cloneDate(props.cancelledAt),
      createdAt: ResourceUnavailablePeriod.cloneDate(props.createdAt),
      updatedAt: ResourceUnavailablePeriod.cloneDate(props.updatedAt),
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

  public get operatorId(): string {
    return this.props.operatorId;
  }

  public get period(): UnavailablePeriod {
    return this.props.period;
  }

  public get reason(): string {
    return this.props.reason;
  }

  public get status(): ResourceUnavailablePeriodStatus {
    return this.props.status;
  }

  public get cancelledAt(): Date | null {
    if (this.props.cancelledAt === null) {
      return null;
    }

    return ResourceUnavailablePeriod.cloneDate(this.props.cancelledAt);
  }

  public get createdAt(): Date {
    return ResourceUnavailablePeriod.cloneDate(this.props.createdAt);
  }

  public get updatedAt(): Date {
    return ResourceUnavailablePeriod.cloneDate(this.props.updatedAt);
  }

  public isActive(): boolean {
    return this.status === ResourceUnavailablePeriodStatus.Active;
  }

  public isCancelled(): boolean {
    return this.status === ResourceUnavailablePeriodStatus.Cancelled;
  }

  public cancel(cancelledAt: Date): ResourceUnavailablePeriod {
    if (this.isCancelled()) {
      throw new ResourceUnavailablePeriodAlreadyCancelledError();
    }

    if (!ResourceUnavailablePeriod.isValidDate(cancelledAt)) {
      throw new InvalidUnavailablePeriodError(
        "cancelledAt must be a valid date.",
      );
    }

    if (this.period.isStartedAtOrBefore(cancelledAt)) {
      throw new CannotCancelStartedResourceUnavailablePeriodError();
    }

    return ResourceUnavailablePeriod.create({
      ...this.props,
      status: ResourceUnavailablePeriodStatus.Cancelled,
      cancelledAt: ResourceUnavailablePeriod.cloneDate(cancelledAt),
      updatedAt: ResourceUnavailablePeriod.cloneDate(cancelledAt),
    });
  }

  private static isValidDate(date: Date): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  private static cloneDate(date: Date): Date {
    return new Date(date.getTime());
  }
}
