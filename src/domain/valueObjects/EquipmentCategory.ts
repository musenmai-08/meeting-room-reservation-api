import { DomainError } from "../errors/DomainError";

export const EquipmentCategory = {
  Projector: "PROJECTOR",
  Monitor: "MONITOR",
  Microphone: "MICROPHONE",
  Speaker: "SPEAKER",
  Whiteboard: "WHITEBOARD",
  Other: "OTHER",
} as const;

export type EquipmentCategory =
  (typeof EquipmentCategory)[keyof typeof EquipmentCategory];

export class InvalidEquipmentCategoryError extends DomainError {
  public constructor(value: string) {
    super(`Invalid equipment category: ${value}`, "INVALID_EQUIPMENT_CATEGORY");
  }
}

const equipmentCategoryValues: readonly string[] =
  Object.values(EquipmentCategory);

export function isEquipmentCategory(value: string): value is EquipmentCategory {
  return equipmentCategoryValues.includes(value);
}

export function parseEquipmentCategory(value: string): EquipmentCategory {
  if (!isEquipmentCategory(value)) {
    throw new InvalidEquipmentCategoryError(value);
  }

  return value;
}
