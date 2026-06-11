import {
  type MeetingRoomRepository,
  type MeetingRoomSearchCriteria,
} from "@application/repositories/MeetingRoomRepository";

export type ListMeetingRoomsInput = {
  capacityGte?: number;
  location?: string;
};

export type ListMeetingRoomsOutput = {
  items: {
    id: string;
    name: string;
    capacity: number;
    location: string | null;
    description: string | null;
  }[];
};

export class ListMeetingRoomsUseCase {
  public constructor(
    private readonly meetingRoomRepository: MeetingRoomRepository,
  ) {}

  public async execute(
    input: ListMeetingRoomsInput = {},
  ): Promise<ListMeetingRoomsOutput> {
    const criteria: MeetingRoomSearchCriteria = {
      capacityGte: input.capacityGte,
      location: input.location,
    };
    const meetingRooms = await this.meetingRoomRepository.findAll(criteria);

    return {
      items: meetingRooms.map((meetingRoom) => ({
        id: meetingRoom.id,
        name: meetingRoom.name,
        capacity: meetingRoom.capacity,
        location: meetingRoom.location,
        description: meetingRoom.description,
      })),
    };
  }
}

