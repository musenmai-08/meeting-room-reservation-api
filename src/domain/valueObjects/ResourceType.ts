import { DomainError } from "../errors/DomainError";

export const ResourceType = {
  MeetingRoom: "MEETING_ROOM", // 会議予約
  Equipment: "EQUIPMENT", // 備品予約
} as const;

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export class InvalidResourceTypeError extends DomainError {
  public constructor(value: string) {
    super(`Invalid resource type: ${value}`, "INVALID_RESOURCE_TYPE");
  }
}

const resourceTypeValues: readonly string[] = Object.values(ResourceType);

export function isResourceType(value: string): value is ResourceType {
  return resourceTypeValues.includes(value);
}

export function parseResourceType(value: string): ResourceType {
  if (!isResourceType(value)) {
    throw new InvalidResourceTypeError(value);
  }

  return value;
}
