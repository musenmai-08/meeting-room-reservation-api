import { DomainError } from "./DomainError";

export class InvalidMeetingRoomError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_MEETING_ROOM");
  }
}

