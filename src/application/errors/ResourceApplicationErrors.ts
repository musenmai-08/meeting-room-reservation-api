import { ApplicationError } from "./ApplicationError";

export class ResourceNotFoundError extends ApplicationError {
  public constructor(resourceId: string) {
    super(`Resource not found: ${resourceId}`, "RESOURCE_NOT_FOUND");
  }
}

