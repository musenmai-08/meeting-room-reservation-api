import {
  type MeetingRoomRepository,
  type MeetingRoomSearchCriteria,
} from "@application/repositories/MeetingRoomRepository";
import { MeetingRoom } from "@domain/entities/MeetingRoom";

export class InMemoryMeetingRoomRepository implements MeetingRoomRepository {
  private readonly meetingRooms = new Map<string, MeetingRoom>();

  public async save(meetingRoom: MeetingRoom): Promise<void> {
    this.meetingRooms.set(meetingRoom.id, meetingRoom);
  }

  public async findById(id: string): Promise<MeetingRoom | null> {
    return this.meetingRooms.get(id) ?? null;
  }

  public async findByName(name: string): Promise<MeetingRoom | null> {
    return (
      [...this.meetingRooms.values()].find(
        (meetingRoom) => meetingRoom.name === name,
      ) ?? null
    );
  }

  public async findAll(
    criteria: MeetingRoomSearchCriteria = {},
  ): Promise<MeetingRoom[]> {
    return [...this.meetingRooms.values()].filter((meetingRoom) => {
      if (
        criteria.capacityGte !== undefined &&
        meetingRoom.capacity < criteria.capacityGte
      ) {
        return false;
      }

      if (
        criteria.location !== undefined &&
        meetingRoom.location !== criteria.location
      ) {
        return false;
      }

      return true;
    });
  }
}

