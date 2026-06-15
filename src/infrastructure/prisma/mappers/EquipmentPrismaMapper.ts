import { Equipment } from "@domain/entities/Equipment";
import {
  type EquipmentCreateInput,
  type EquipmentModel,
} from "../../../generated/prisma/models/Equipment";
import { parseEquipmentCategory } from "@domain/valueObjects/EquipmentCategory";

export class EquipmentPrismaMapper {
  public static toDomain(record: EquipmentModel): Equipment {
    return Equipment.create({
      id: record.id,
      name: record.name,
      category: parseEquipmentCategory(record.category),
      location: record.location,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public static toPersistence(equipment: Equipment): EquipmentCreateInput {
    return {
      id: equipment.id,
      name: equipment.name,
      category: equipment.category,
      location: equipment.location,
      description: equipment.description,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }
}
