import { DomainError } from "./DomainError";

export class InvalidResourceTypeError extends DomainError {
  public constructor(value: string) {
    super(`Invalid resource type: ${value}`, "INVALID_RESOURCE_TYPE");
  }
}

