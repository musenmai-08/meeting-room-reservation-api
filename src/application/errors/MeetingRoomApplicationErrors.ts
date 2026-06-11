import { ApplicationError } from "./ApplicationError";

export class MeetingRoomAlreadyExistsError extends ApplicationError {
  public constructor(name: string) {
    super(`Meeting room already exists: ${name}`, "MEETING_ROOM_ALREADY_EXISTS");
  }
}

