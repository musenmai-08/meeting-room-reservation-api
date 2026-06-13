import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { type SearchAvailableResourcesOutput } from "@application/usecases/resources/SearchAvailableResourcesUseCase";

type AvailableResourceResponse =
  | {
      resourceType: typeof ResourceType.MeetingRoom;
      id: string;
      name: string;
      capacity: number;
      location: string | null;
    }
  | {
      resourceType: typeof ResourceType.Equipment;
      id: string;
      name: string;
      category: EquipmentCategory;
      location: string | null;
    };

export class AvailableResourcePresenter {
  public static presentList(output: SearchAvailableResourcesOutput): {
    items: AvailableResourceResponse[];
  } {
    return {
      items: output.items.map((item) => ({ ...item })),
    };
  }
}
