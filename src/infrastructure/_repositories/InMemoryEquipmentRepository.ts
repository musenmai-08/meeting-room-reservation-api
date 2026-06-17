import {
  type EquipmentRepository,
  type EquipmentSearchCriteria,
} from "@application/repositories/EquipmentRepository";
import { Equipment } from "@domain/entities/Equipment";

export class InMemoryEquipmentRepository implements EquipmentRepository {
  private readonly equipments = new Map<string, Equipment>();

  public async save(equipment: Equipment): Promise<void> {
    this.equipments.set(equipment.id, equipment);
  }

  public async findById(id: string): Promise<Equipment | null> {
    return this.equipments.get(id) ?? null;
  }

  public async findByName(name: string): Promise<Equipment | null> {
    return (
      [...this.equipments.values()].find(
        (equipment) => equipment.name === name,
      ) ?? null
    );
  }

  public async findAll(
    criteria: EquipmentSearchCriteria = {},
  ): Promise<Equipment[]> {
    return [...this.equipments.values()].filter((equipment) => {
      if (
        criteria.category !== undefined &&
        equipment.category !== criteria.category
      ) {
        return false;
      }

      if (
        criteria.location !== undefined &&
        equipment.location !== criteria.location
      ) {
        return false;
      }

      return true;
    });
  }
}

