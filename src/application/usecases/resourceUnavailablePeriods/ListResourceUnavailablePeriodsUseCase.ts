import { ResourceUnavailablePeriodRepository } from "@application/repositories/ResourceUnavailablePeriodRepository";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

export type ListResourceUnavailablePeriodsInput = {
  resourceType?: ResourceType;
  resourceId?: string;
  status?: ResourceUnavailablePeriodStatus;
  from?: Date;
  to?: Date;
};

export type ListResourceUnavailablePeriodsOutput = {
  items: {
    id: string;
    resourceType: ResourceType;
    resourceId: string;
    operatorId: string;
    startAt: Date;
    endAt: Date;
    reason: string;
    status: ResourceUnavailablePeriodStatus;
    cancelledAt: Date | null;
  }[];
};

export class ListResourceUnavailablePeriodsUseCase {
  public constructor(
    private readonly resourceUnavailablePeriodRepository: ResourceUnavailablePeriodRepository,
  ) {}

  public async execute(
    input: ListResourceUnavailablePeriodsInput = {},
  ): Promise<ListResourceUnavailablePeriodsOutput> {
    const resourceUnavailablePeriods =
      await this.resourceUnavailablePeriodRepository.findAll({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        status: input.status,
        from: input.from,
        to: input.to,
      });

    return {
      items: resourceUnavailablePeriods.map((resourceUnavailablePeriod) => ({
        id: resourceUnavailablePeriod.id,
        resourceType: resourceUnavailablePeriod.resourceType,
        resourceId: resourceUnavailablePeriod.resourceId,
        operatorId: resourceUnavailablePeriod.operatorId,
        startAt: resourceUnavailablePeriod.period.startAt,
        endAt: resourceUnavailablePeriod.period.endAt,
        reason: resourceUnavailablePeriod.reason,
        status: resourceUnavailablePeriod.status,
        cancelledAt: resourceUnavailablePeriod.cancelledAt,
      })),
    };
  }
}
