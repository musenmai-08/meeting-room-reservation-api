import { MeetingRoom } from "@domain/entities/MeetingRoom";

export type MeetingRoomSearchCriteria = {
  capacityGte?: number;
  location?: string;
};

export interface MeetingRoomRepository {
  save(meetingRoom: MeetingRoom): Promise<void>;
  findById(id: string): Promise<MeetingRoom | null>;
  findByName(name: string): Promise<MeetingRoom | null>;
  findAll(criteria?: MeetingRoomSearchCriteria): Promise<MeetingRoom[]>;
}

