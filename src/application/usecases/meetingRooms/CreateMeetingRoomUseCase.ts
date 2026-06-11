import { MeetingRoomAlreadyExistsError } from "@application/errors/MeetingRoomApplicationErrors";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { MeetingRoom } from "@domain/entities/MeetingRoom";

export type CreateMeetingRoomInput = {
  name: string;
  capacity: number;
  location?: string | null;
  description?: string | null;
};

export type CreateMeetingRoomOutput = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CreateMeetingRoomUseCase {
  public constructor(
    private readonly meetingRoomRepository: MeetingRoomRepository, // MeetingRoomRepository を implements したクラスのインスタンス
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: CreateMeetingRoomInput,
  ): Promise<CreateMeetingRoomOutput> {
    const name = input.name.trim();
    const existingMeetingRoom =
      await this.meetingRoomRepository.findByName(name);

    if (existingMeetingRoom !== null) {
      throw new MeetingRoomAlreadyExistsError(name);
    }

    const now = this.clock.now();
    const meetingRoom = MeetingRoom.create({
      id: this.idGenerator.generate(),
      name,
      capacity: input.capacity,
      location: input.location ?? null,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await this.meetingRoomRepository.save(meetingRoom);

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
