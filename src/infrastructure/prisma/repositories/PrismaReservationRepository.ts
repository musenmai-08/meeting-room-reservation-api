import {
  type OverlappingReservationResourceTypeCriteria,
  type ReservationRepository,
  type ReservationResourceCriteria,
  type ReservationSearchCriteria,
} from "@application/repositories/ReservationRepository";
import { Reservation } from "@domain/entities/Reservation";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { type PrismaClient } from "../../../generated/prisma/client";
import { type ReservationWhereInput } from "../../../generated/prisma/models/Reservation";
import { ReservationPrismaMapper } from "../mappers/ReservationPrismaMapper";
import { prisma } from "../prismaClient";

export class PrismaReservationRepository implements ReservationRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async save(reservation: Reservation): Promise<void> {
    const data = ReservationPrismaMapper.toPersistence(reservation);

    await this.client.reservation.upsert({
      where: {
        id: reservation.id,
      },
      create: data,
      update: data,
    });
  }

  public async findById(id: string): Promise<Reservation | null> {
    const record = await this.client.reservation.findUnique({
      where: {
        id,
      },
    });

    return record === null ? null : ReservationPrismaMapper.toDomain(record);
  }

  public async findAll(
    criteria: ReservationSearchCriteria = {},
  ): Promise<Reservation[]> {
    const where = this.buildSearchWhere(criteria);
    const records = await this.client.reservation.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map((record) => ReservationPrismaMapper.toDomain(record));
  }

  public async findByResource(
    criteria: ReservationResourceCriteria,
  ): Promise<Reservation[]> {
    const where = this.buildPeriodWhere(criteria);
    const records = await this.client.reservation.findMany({
      where: {
        ...where,
        resourceType: criteria.resourceType,
        resourceId: criteria.resourceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map((record) => ReservationPrismaMapper.toDomain(record));
  }

  public async findOverlappingByResourceType(
    criteria: OverlappingReservationResourceTypeCriteria,
  ): Promise<Reservation[]> {
    const records = await this.client.reservation.findMany({
      where: {
        resourceType: criteria.resourceType,
        status: ReservationStatus.Reserved,
        startAt: {
          lt: criteria.endAt,
        },
        endAt: {
          gt: criteria.startAt,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map((record) => ReservationPrismaMapper.toDomain(record));
  }

  private buildSearchWhere(
    criteria: ReservationSearchCriteria,
  ): ReservationWhereInput {
    const where = this.buildPeriodWhere(criteria);

    if (criteria.userId !== undefined) {
      where.userId = criteria.userId;
    }

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
  }): ReservationWhereInput {
    const where: ReservationWhereInput = {};

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
