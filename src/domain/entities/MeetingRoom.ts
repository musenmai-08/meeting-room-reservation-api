import { DomainError } from "../errors/DomainError";

type MeetingRoomProps = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class InvalidMeetingRoomError extends DomainError {
  public constructor(message: string) {
    super(message, "INVALID_MEETING_ROOM");
  }
}

export class MeetingRoom {
  // Entity は ID で同一性を判断するため、値は private に閉じ込めます。
  private constructor(private readonly props: MeetingRoomProps) {}

  public static create(props: MeetingRoomProps): MeetingRoom {
    const name = props.name.trim();

    if (props.id.trim().length === 0) {
      throw new InvalidMeetingRoomError("id is required.");
    }

    if (name.length === 0 || name.length > 100) {
      throw new InvalidMeetingRoomError(
        "name must be between 1 and 100 characters.",
      );
    }

    if (!Number.isInteger(props.capacity) || props.capacity < 1) {
      throw new InvalidMeetingRoomError(
        "capacity must be an integer greater than or equal to 1.",
      );
    }

    if (!MeetingRoom.isValidDate(props.createdAt)) {
      throw new InvalidMeetingRoomError("createdAt must be a valid date.");
    }

    if (!MeetingRoom.isValidDate(props.updatedAt)) {
      throw new InvalidMeetingRoomError("updatedAt must be a valid date.");
    }

    return new MeetingRoom({
      ...props,
      name,
      // Date は mutable なので、Entity の外から変更されないよう clone します。
      createdAt: MeetingRoom.cloneDate(props.createdAt),
      updatedAt: MeetingRoom.cloneDate(props.updatedAt),
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get capacity(): number {
    return this.props.capacity;
  }

  public get location(): string | null {
    return this.props.location;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get createdAt(): Date {
    return MeetingRoom.cloneDate(this.props.createdAt);
  }

  public get updatedAt(): Date {
    return MeetingRoom.cloneDate(this.props.updatedAt);
  }

  public equals(other: MeetingRoom): boolean {
    return this.id === other.id;
  }

  private static isValidDate(date: Date): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  private static cloneDate(date: Date): Date {
    return new Date(date.getTime());
  }
}

