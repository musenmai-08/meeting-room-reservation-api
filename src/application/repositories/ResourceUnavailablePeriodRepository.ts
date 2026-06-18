import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

export type ResourceUnavailablePeriodSearchCriteria = {
  resourceType?: ResourceType;
  resourceId?: string;
  status?: ResourceUnavailablePeriodStatus;
  from?: Date;
  to?: Date;
};

export type ResourceUnavailablePeriodResourceCriteria = {
  resourceType: ResourceType;
  resourceId: string;
};

export interface ResourceUnavailablePeriodRepository {
  save(resourceUnavailablePeriod: ResourceUnavailablePeriod): Promise<void>;
  findAll(
    criteria?: ResourceUnavailablePeriodSearchCriteria,
  ): Promise<ResourceUnavailablePeriod[]>;
  findById(id: string): Promise<ResourceUnavailablePeriod | null>;
  findByResource(
    criteria: ResourceUnavailablePeriodResourceCriteria,
  ): Promise<ResourceUnavailablePeriod[]>;
}
