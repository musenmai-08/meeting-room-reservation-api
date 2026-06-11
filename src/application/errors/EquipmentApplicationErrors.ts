import { ApplicationError } from "./ApplicationError";

export class EquipmentAlreadyExistsError extends ApplicationError {
  public constructor(name: string) {
    super(`Equipment already exists: ${name}`, "EQUIPMENT_ALREADY_EXISTS");
  }
}

