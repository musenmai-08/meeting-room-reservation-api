import {
  type MeetingRoomRepository,
  type MeetingRoomSearchCriteria,
} from "@application/repositories/MeetingRoomRepository";
import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { type PrismaClient } from "../../../generated/prisma/client";
import { type MeetingRoomWhereInput } from "../../../generated/prisma/models/MeetingRoom";
import { MeetingRoomPrismaMapper } from "../mappers/MeetingRoomPrismaMapper";
import { prisma } from "../prismaClient";

export class PrismaMeetingRoomRepository implements MeetingRoomRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async save(meetingRoom: MeetingRoom): Promise<void> {
    const data = MeetingRoomPrismaMapper.toPersistence(meetingRoom);

    await this.client.meetingRoom.upsert({
      where: {
        id: meetingRoom.id,
      },
      create: data,
      update: data,
    });
  }

  public async findById(id: string): Promise<MeetingRoom | null> {
    const record = await this.client.meetingRoom.findUnique({
      where: {
        id,
      },
    });

    return record === null ? null : MeetingRoomPrismaMapper.toDomain(record);
  }

  public async findByName(name: string): Promise<MeetingRoom | null> {
    const record = await this.client.meetingRoom.findUnique({
      where: {
        name,
      },
    });

    return record === null ? null : MeetingRoomPrismaMapper.toDomain(record);
  }

  public async findAll(
    criteria: MeetingRoomSearchCriteria = {},
  ): Promise<MeetingRoom[]> {
    const where = this.buildWhere(criteria);
    const records = await this.client.meetingRoom.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map((record) => MeetingRoomPrismaMapper.toDomain(record));
  }

  private buildWhere(
    criteria: MeetingRoomSearchCriteria,
  ): MeetingRoomWhereInput {
    const where: MeetingRoomWhereInput = {};

    if (criteria.capacityGte !== undefined) {
      where.capacity = {
        gte: criteria.capacityGte,
      };
    }

    if (criteria.location !== undefined) {
      where.location = criteria.location;
    }

    return where;
  }
}
