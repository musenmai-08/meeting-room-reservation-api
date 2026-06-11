import { Equipment } from "@domain/entities/Equipment";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";

export type EquipmentSearchCriteria = {
  category?: EquipmentCategory;
  location?: string;
};

export interface EquipmentRepository {
  save(equipment: Equipment): Promise<void>;
  findById(id: string): Promise<Equipment | null>;
  findByName(name: string): Promise<Equipment | null>;
  findAll(criteria?: EquipmentSearchCriteria): Promise<Equipment[]>;
}

