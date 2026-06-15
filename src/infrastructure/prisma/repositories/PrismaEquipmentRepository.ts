import {
  type EquipmentRepository,
  type EquipmentSearchCriteria,
} from "@application/repositories/EquipmentRepository";
import { Equipment } from "@domain/entities/Equipment";
import { type PrismaClient } from "../../../generated/prisma/client";
import { type EquipmentWhereInput } from "../../../generated/prisma/models/Equipment";
import { EquipmentPrismaMapper } from "../mappers/EquipmentPrismaMapper";
import { prisma } from "../prismaClient";

export class PrismaEquipmentRepository implements EquipmentRepository {
  public constructor(private readonly client: PrismaClient = prisma) {}

  public async save(equipment: Equipment): Promise<void> {
    const data = EquipmentPrismaMapper.toPersistence(equipment);

    await this.client.equipment.upsert({
      where: { id: equipment.id },
      update: data,
      create: data,
    });
  }

  public async findById(id: string): Promise<Equipment | null> {
    const record = await this.client.equipment.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return EquipmentPrismaMapper.toDomain(record);
  }

  public async findByName(name: string): Promise<Equipment | null> {
    const record = await this.client.equipment.findUnique({
      where: { name },
    });

    if (!record) {
      return null;
    }

    return EquipmentPrismaMapper.toDomain(record);
  }

  public async findAll(
    criteria: EquipmentSearchCriteria = {},
  ): Promise<Equipment[]> {
    const where = this.buildWhere(criteria);
    const records = await this.client.equipment.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
    });

    return records.map((record) => EquipmentPrismaMapper.toDomain(record));
  }

  private buildWhere(criteria: EquipmentSearchCriteria): EquipmentWhereInput {
    const where: EquipmentWhereInput = {};

    if (criteria.category !== undefined) {
      where.category = criteria.category;
    }

    if (criteria.location !== undefined) {
      where.location = criteria.location;
    }

    return where;
  }
}
