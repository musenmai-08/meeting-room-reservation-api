import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { type MeetingRoomCreateInput } from "../../../generated/prisma/models/MeetingRoom";
import { type MeetingRoomModel } from "../../../generated/prisma/models/MeetingRoom";

export class MeetingRoomPrismaMapper {
  public static toDomain(record: MeetingRoomModel): MeetingRoom {
    return MeetingRoom.create({
      id: record.id,
      name: record.name,
      capacity: record.capacity,
      location: record.location,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public static toPersistence(
    meetingRoom: MeetingRoom,
  ): MeetingRoomCreateInput {
    return {
      id: meetingRoom.id,
      name: meetingRoom.name,
      capacity: meetingRoom.capacity,
      location: meetingRoom.location,
      description: meetingRoom.description,
      createdAt: meetingRoom.createdAt,
      updatedAt: meetingRoom.updatedAt,
    };
  }
}
