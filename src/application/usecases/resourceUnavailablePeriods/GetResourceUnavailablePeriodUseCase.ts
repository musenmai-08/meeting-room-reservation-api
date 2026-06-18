import { ResourceUnavailablePeriodNotFoundError } from "@application/errors/ResourceUnavailablePeriodError";
import { ResourceUnavailablePeriodRepository } from "@application/repositories/ResourceUnavailablePeriodRepository";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

export type GetResourceUnavailablePeriodInput = {
  id: string;
};

export type GetResourceUnavailablePeriodOutput = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  operatorId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  status: ResourceUnavailablePeriodStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class GetResourceUnavailablePeriodUseCase {
  public constructor(
    private readonly resourceUnavailablePeriodRepository: ResourceUnavailablePeriodRepository,
  ) {}

  public async execute(
    input: GetResourceUnavailablePeriodInput,
  ): Promise<GetResourceUnavailablePeriodOutput> {
    const resourceUnavailablePeriod =
      await this.resourceUnavailablePeriodRepository.findById(input.id);

    if (resourceUnavailablePeriod === null) {
      throw new ResourceUnavailablePeriodNotFoundError();
    }

    return {
      id: resourceUnavailablePeriod.id,
      resourceType: resourceUnavailablePeriod.resourceType,
      resourceId: resourceUnavailablePeriod.resourceId,
      operatorId: resourceUnavailablePeriod.operatorId,
      startAt: resourceUnavailablePeriod.period.startAt,
      endAt: resourceUnavailablePeriod.period.endAt,
      reason: resourceUnavailablePeriod.reason,
      status: resourceUnavailablePeriod.status,
      cancelledAt: resourceUnavailablePeriod.cancelledAt,
      createdAt: resourceUnavailablePeriod.createdAt,
      updatedAt: resourceUnavailablePeriod.updatedAt,
    };
  }
}
