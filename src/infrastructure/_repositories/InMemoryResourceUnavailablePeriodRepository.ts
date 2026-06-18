import {
  type ResourceUnavailablePeriodRepository,
  type ResourceUnavailablePeriodResourceCriteria,
  type ResourceUnavailablePeriodSearchCriteria,
} from "@application/repositories/ResourceUnavailablePeriodRepository";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";

export class InMemoryResourceUnavailablePeriodRepository
  implements ResourceUnavailablePeriodRepository
{
  private readonly resourceUnavailablePeriods = new Map<
    string,
    ResourceUnavailablePeriod
  >();

  public async save(
    resourceUnavailablePeriod: ResourceUnavailablePeriod,
  ): Promise<void> {
    this.resourceUnavailablePeriods.set(
      resourceUnavailablePeriod.id,
      resourceUnavailablePeriod,
    );
  }

  public async findAll(
    criteria: ResourceUnavailablePeriodSearchCriteria = {},
  ): Promise<ResourceUnavailablePeriod[]> {
    return [...this.resourceUnavailablePeriods.values()].filter(
      (resourceUnavailablePeriod) =>
        this.matchesSearchCriteria(resourceUnavailablePeriod, criteria),
    );
  }

  public async findById(
    id: string,
  ): Promise<ResourceUnavailablePeriod | null> {
    return this.resourceUnavailablePeriods.get(id) ?? null;
  }

  public async findByResource(
    criteria: ResourceUnavailablePeriodResourceCriteria,
  ): Promise<ResourceUnavailablePeriod[]> {
    return [...this.resourceUnavailablePeriods.values()].filter(
      (resourceUnavailablePeriod) =>
        resourceUnavailablePeriod.resourceType === criteria.resourceType &&
        resourceUnavailablePeriod.resourceId === criteria.resourceId,
    );
  }

  private matchesSearchCriteria(
    resourceUnavailablePeriod: ResourceUnavailablePeriod,
    criteria: ResourceUnavailablePeriodSearchCriteria,
  ): boolean {
    if (
      criteria.resourceType !== undefined &&
      resourceUnavailablePeriod.resourceType !== criteria.resourceType
    ) {
      return false;
    }

    if (
      criteria.resourceId !== undefined &&
      resourceUnavailablePeriod.resourceId !== criteria.resourceId
    ) {
      return false;
    }

    if (
      criteria.status !== undefined &&
      resourceUnavailablePeriod.status !== criteria.status
    ) {
      return false;
    }

    if (
      criteria.from !== undefined &&
      resourceUnavailablePeriod.period.startAt.getTime() < criteria.from.getTime()
    ) {
      return false;
    }

    if (
      criteria.to !== undefined &&
      resourceUnavailablePeriod.period.endAt.getTime() > criteria.to.getTime()
    ) {
      return false;
    }

    return true;
  }
}
