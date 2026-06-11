import {
  type EquipmentRepository,
  type EquipmentSearchCriteria,
} from "@application/repositories/EquipmentRepository";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";

export type ListEquipmentsInput = {
  category?: EquipmentCategory;
  location?: string;
};

export type ListEquipmentsOutput = {
  items: {
    id: string;
    name: string;
    category: EquipmentCategory;
    location: string | null;
    description: string | null;
  }[];
};

export class ListEquipmentsUseCase {
  public constructor(private readonly equipmentRepository: EquipmentRepository) {}

  public async execute(
    input: ListEquipmentsInput = {},
  ): Promise<ListEquipmentsOutput> {
    const criteria: EquipmentSearchCriteria = {
      category: input.category,
      location: input.location,
    };
    const equipments = await this.equipmentRepository.findAll(criteria);

    return {
      items: equipments.map((equipment) => ({
        id: equipment.id,
        name: equipment.name,
        category: equipment.category,
        location: equipment.location,
        description: equipment.description,
      })),
    };
  }
}

