import {
  ResourceUnavailablePeriodRepository,
  ResourceUnavailablePeriodResourceCriteria,
  ResourceUnavailablePeriodSearchCriteria,
} from "@application/repositories/ResourceUnavailablePeriodRepository";
import { type PrismaClient } from "../../../generated/prisma/client";

import { prisma } from "../prismaClient";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceUnavailablePeriodPrismaMapper } from "../mappers/ResourceUnavailablePeriodPrismaMapper";
import { ResourceUnavailablePeriodWhereInput } from "../../../generated/prisma/models";

export class PrismaResourceUnavailablePeriodRepository implements ResourceUnavailablePeriodRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async save(
    resourceUnavailablePeriod: ResourceUnavailablePeriod,
  ): Promise<void> {
    const data = ResourceUnavailablePeriodPrismaMapper.toPersistence(
      resourceUnavailablePeriod,
    );

    await this.client.resourceUnavailablePeriod.upsert({
      where: { id: resourceUnavailablePeriod.id },
      create: data,
      update: data,
    });
  }

  public async findAll(
    criteria: ResourceUnavailablePeriodSearchCriteria = {},
  ): Promise<ResourceUnavailablePeriod[]> {
    const where = this.buildSearchWhere(criteria);
    const result = await this.client.resourceUnavailablePeriod.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });
    return result.map(ResourceUnavailablePeriodPrismaMapper.toDomain);
  }

  public async findById(id: string): Promise<ResourceUnavailablePeriod | null> {
    const record = await this.client.resourceUnavailablePeriod.findUnique({
      where: {
        id,
      },
    });

    return record
      ? ResourceUnavailablePeriodPrismaMapper.toDomain(record)
      : null;
  }

  public async findByResource(
    criteria: ResourceUnavailablePeriodResourceCriteria,
  ): Promise<ResourceUnavailablePeriod[]> {
    const where = this.buildSearchWhere(criteria);
    const records = await this.client.resourceUnavailablePeriod.findMany({
      where: {
        ...where,
        resourceType: criteria.resourceType,
        resourceId: criteria.resourceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map(ResourceUnavailablePeriodPrismaMapper.toDomain);
  }

  private buildSearchWhere(
    criteria: ResourceUnavailablePeriodSearchCriteria,
  ): ResourceUnavailablePeriodWhereInput {
    const where = this.buildPeriodWhere(criteria);

    if (criteria.resourceType !== undefined) {
      where.resourceType = criteria.resourceType;
    }

    if (criteria.resourceId !== undefined) {
      where.resourceId = criteria.resourceId;
    }

    if (criteria.status !== undefined) {
      where.status = criteria.status;
    }

    return where;
  }

  private buildPeriodWhere(criteria: {
    from?: Date;
    to?: Date;
  }): ResourceUnavailablePeriodWhereInput {
    const where: ResourceUnavailablePeriodWhereInput = {};

    if (criteria.from !== undefined) {
      where.startAt = {
        gte: criteria.from,
      };
    }

    if (criteria.to !== undefined) {
      where.endAt = {
        lte: criteria.to,
      };
    }

    return where;
  }
}
