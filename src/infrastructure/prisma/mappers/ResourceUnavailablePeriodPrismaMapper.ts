import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import {
  ResourceUnavailablePeriodModel,
  ResourceUnavailablePeriodUncheckedCreateInput,
} from "../../../generated/prisma/models";
import { parseResourceType } from "@domain/valueObjects/ResourceType";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";
import { parseResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

export class ResourceUnavailablePeriodPrismaMapper {
  public static toDomain(
    record: ResourceUnavailablePeriodModel,
  ): ResourceUnavailablePeriod {
    return ResourceUnavailablePeriod.create({
      id: record.id,
      resourceType: parseResourceType(record.resourceType),
      resourceId: record.resourceId,
      operatorId: record.operatorId,
      period: UnavailablePeriod.create(record.startAt, record.endAt),
      reason: record.reason,
      status: parseResourceUnavailablePeriodStatus(record.status),
      cancelledAt: record.cancelledAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public static toPersistence(
    resourceUnavailablePeriod: ResourceUnavailablePeriod,
  ): ResourceUnavailablePeriodUncheckedCreateInput {
    return {
      id: resourceUnavailablePeriod.id,
      resourceType: resourceUnavailablePeriod.resourceType,
      resourceId: resourceUnavailablePeriod.resourceId,
      startAt: resourceUnavailablePeriod.period.startAt,
      operatorId: resourceUnavailablePeriod.operatorId,
      endAt: resourceUnavailablePeriod.period.endAt,
      reason: resourceUnavailablePeriod.reason,
      status: resourceUnavailablePeriod.status,
      cancelledAt: resourceUnavailablePeriod.cancelledAt,
      createdAt: resourceUnavailablePeriod.createdAt,
      updatedAt: resourceUnavailablePeriod.updatedAt,
    };
  }
}
