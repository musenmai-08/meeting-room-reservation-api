import {
  type CreateMeetingRoomOutput,
} from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import {
  type ListMeetingRoomsOutput,
} from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";

type MeetingRoomResponse = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  description: string | null;
};

type CreatedMeetingRoomResponse = MeetingRoomResponse & {
  createdAt: string;
  updatedAt: string;
};

export class MeetingRoomPresenter {
  public static presentCreated(
    output: CreateMeetingRoomOutput,
  ): CreatedMeetingRoomResponse {
    return {
      id: output.id,
      name: output.name,
      capacity: output.capacity,
      location: output.location,
      description: output.description,
      createdAt: output.createdAt.toISOString(),
      updatedAt: output.updatedAt.toISOString(),
    };
  }

  public static presentList(output: ListMeetingRoomsOutput): {
    items: MeetingRoomResponse[];
  } {
    return {
      items: output.items.map((item) => ({
        id: item.id,
        name: item.name,
        capacity: item.capacity,
        location: item.location,
        description: item.description,
      })),
    };
  }
}

