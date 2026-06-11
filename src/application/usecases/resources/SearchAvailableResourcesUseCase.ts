import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ResourceType } from "@domain/valueObjects/ResourceType";

export type SearchAvailableResourcesInput = {
  resourceType: ResourceType;
  startAt: Date;
  endAt: Date;
  capacityGte?: number;
  category?: EquipmentCategory;
};

export type SearchAvailableResourcesOutput = {
  items: (
    | {
        resourceType: typeof ResourceType.MeetingRoom;
        id: string;
        name: string;
        capacity: number;
        location: string | null;
      }
    | {
        resourceType: typeof ResourceType.Equipment;
        id: string;
        name: string;
        category: EquipmentCategory;
        location: string | null;
      }
  )[];
};

// 予約可能な会議室・備品を検索する UseCase
export class SearchAvailableResourcesUseCase {
  public constructor(
    private readonly meetingRoomRepository: MeetingRoomRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly reservationRepository: ReservationRepository,
  ) {}

  public async execute(
    input: SearchAvailableResourcesInput,
  ): Promise<SearchAvailableResourcesOutput> {
    const period = ReservationPeriod.create(input.startAt, input.endAt);

    // 指定時間帯で空いている会議室だけを返す
    if (input.resourceType === ResourceType.MeetingRoom) {
      const meetingRooms = await this.meetingRoomRepository.findAll({
        capacityGte: input.capacityGte,
      });
      // 指定時間帯と重なる会議室予約をまとめて取得
      const overlappingReservations =
        await this.reservationRepository.findOverlappingByResourceType({
          resourceType: ResourceType.MeetingRoom,
          startAt: period.startAt,
          endAt: period.endAt,
        });
      const reservedResourceIds = new Set(
        overlappingReservations.map((reservation) => reservation.resourceId),
      );

      return {
        items: meetingRooms
          .filter((meetingRoom) => !reservedResourceIds.has(meetingRoom.id))
          .map((meetingRoom) => ({
            resourceType: ResourceType.MeetingRoom,
            id: meetingRoom.id,
            name: meetingRoom.name,
            capacity: meetingRoom.capacity,
            location: meetingRoom.location,
          })),
      };
    }

    const equipments = await this.equipmentRepository.findAll({
      category: input.category,
    });
    const overlappingReservations =
      await this.reservationRepository.findOverlappingByResourceType({
        resourceType: ResourceType.Equipment,
        startAt: period.startAt,
        endAt: period.endAt,
      });
    const reservedResourceIds = new Set(
      overlappingReservations.map((reservation) => reservation.resourceId),
    );

    return {
      items: equipments
        .filter((equipment) => !reservedResourceIds.has(equipment.id))
        .map((equipment) => ({
          resourceType: ResourceType.Equipment,
          id: equipment.id,
          name: equipment.name,
          category: equipment.category,
          location: equipment.location,
        })),
    };
  }
}
