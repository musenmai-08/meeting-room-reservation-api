import { type CreateEquipmentOutput } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { type ListEquipmentsOutput } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";

type EquipmentResponse = {
  id: string;
  name: string;
  category: EquipmentCategory;
  location: string | null;
  description: string | null;
};

type CreatedEquipmentResponse = EquipmentResponse & {
  createdAt: string;
  updatedAt: string;
};

export class EquipmentPresenter {
  public static presentCreated(
    output: CreateEquipmentOutput,
  ): CreatedEquipmentResponse {
    return {
      id: output.id,
      name: output.name,
      category: output.category,
      location: output.location,
      description: output.description,
      createdAt: output.createdAt.toISOString(),
      updatedAt: output.updatedAt.toISOString(),
    };
  }

  public static presentList(output: ListEquipmentsOutput): {
    items: EquipmentResponse[];
  } {
    return {
      items: output.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        location: item.location,
        description: item.description,
      })),
    };
  }
}
