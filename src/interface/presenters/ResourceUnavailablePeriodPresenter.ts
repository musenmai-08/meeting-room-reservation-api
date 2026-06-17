import { CancelResourceUnavailablePeriodOutput } from "@application/usecases/resourceUnavailablePeriods/CancelResourceUnavailablePeriodUseCase";
import { CreateResourceUnavailablePeriodOutput } from "@application/usecases/resourceUnavailablePeriods/CreateResourceUnavailablePeriodUseCase";
import { GetResourceUnavailablePeriodOutput } from "@application/usecases/resourceUnavailablePeriods/GetResourceUnavailablePeriodUseCase";
import { ListResourceUnavailablePeriodsOutput } from "@application/usecases/resourceUnavailablePeriods/ListResourceUnavailablePeriodsUseCase";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

type ResourceUnavailablePeriodResponse = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  operatorId: string;
  startAt: string;
  endAt: string;
  reason: string;
  status: ResourceUnavailablePeriodStatus;
  cancelledAt: string | null;
};
type DetailResourceUnavailablePeriodResponse =
  ResourceUnavailablePeriodResponse & {
    createdAt: string;
    updatedAt: string;
  };

export class ResourceUnavailablePeriodPresenter {
  public static presentCreated(
    output: CreateResourceUnavailablePeriodOutput,
  ): DetailResourceUnavailablePeriodResponse {
    return this.presentDetailed(output);
  }

  public static presentDetail(
    output: GetResourceUnavailablePeriodOutput,
  ): DetailResourceUnavailablePeriodResponse {
    return this.presentDetailed(output);
  }

  public static presentCancelled(
    output: CancelResourceUnavailablePeriodOutput,
  ): {
    id: string;
    status: ResourceUnavailablePeriodStatus;
    cancelledAt: string | null;
  } {
    return {
      id: output.id,
      status: output.status,
      cancelledAt: this.presentNullableDate(output.cancelledAt),
    };
  }

  public static presentList(output: ListResourceUnavailablePeriodsOutput): {
    items: ResourceUnavailablePeriodResponse[];
  } {
    return {
      items: output.items.map((item) => ({
        id: item.id,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        operatorId: item.operatorId,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        reason: item.reason,
        status: item.status,
        cancelledAt: this.presentNullableDate(item.cancelledAt),
      })),
    };
  }

  private static presentDetailed(
    output:
      | CreateResourceUnavailablePeriodOutput
      | GetResourceUnavailablePeriodOutput,
  ): DetailResourceUnavailablePeriodResponse {
    return {
      id: output.id,
      resourceType: output.resourceType,
      resourceId: output.resourceId,
      operatorId: output.operatorId,
      startAt: output.startAt.toISOString(),
      endAt: output.endAt.toISOString(),
      reason: output.reason,
      status: output.status,
      cancelledAt: this.presentNullableDate(output.cancelledAt),
      createdAt: output.createdAt.toISOString(),
      updatedAt: output.updatedAt.toISOString(),
    };
  }

  private static presentNullableDate(date: Date | null): string | null {
    return date === null ? null : date.toISOString();
  }
}
