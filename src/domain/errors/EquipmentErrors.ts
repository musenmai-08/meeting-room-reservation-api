import { DomainError } from "./DomainError";

export class InvalidEquipmentError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_EQUIPMENT");
  }
}

export class InvalidEquipmentCategoryError extends DomainError {
  public constructor(value: string) {
    super(`Invalid equipment category: ${value}`, "INVALID_EQUIPMENT_CATEGORY");
  }
}

