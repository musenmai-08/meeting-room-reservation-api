import { InvalidEquipmentCategoryError } from "../errors/EquipmentErrors";

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
