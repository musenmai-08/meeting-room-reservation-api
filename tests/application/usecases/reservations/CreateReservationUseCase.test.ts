import { describe, expect, it } from "vitest";

import {
  ReservationConflictError,
  ReservationStartAtMustBeFutureError,
} from "@application/errors/ReservationApplicationErrors";
import { ResourceNotFoundError } from "@application/errors/ResourceApplicationErrors";
import { type Clock } from "@application/services/Clock";
import { type IdGenerator } from "@application/services/IdGenerator";
import { CreateReservationUseCase } from "@application/usecases/reservations/CreateReservationUseCase";
import { Equipment } from "@domain/entities/Equipment";
import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { Reservation } from "@domain/entities/Reservation";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { InMemoryEquipmentRepository } from "@infrastructure/_repositories/InMemoryEquipmentRepository";
import { InMemoryMeetingRoomRepository } from "@infrastructure/_repositories/InMemoryMeetingRoomRepository";
import { InMemoryReservationRepository } from "@infrastructure/_repositories/InMemoryReservationRepository";
import { InMemoryResourceUnavailablePeriodRepository } from "@infrastructure/_repositories/InMemoryResourceUnavailablePeriodRepository";

class FixedIdGenerator implements IdGenerator {
  public constructor(private readonly id: string) {}

  public generate(): string {
    return this.id;
  }
}

class FixedClock implements Clock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

const date = (isoString: string): Date => new Date(isoString);

const createMeetingRoom = (id = "mr_001"): MeetingRoom =>
  MeetingRoom.create({
    id,
    name: "会議室A",
    capacity: 8,
    location: "東京本社 3F",
    description: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
  });

const createEquipment = (id = "eq_001"): Equipment =>
  Equipment.create({
    id,
    name: "プロジェクターA",
    category: EquipmentCategory.Projector,
    location: "東京本社 2F",
    description: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
  });

const createReservation = (
  overrides: Partial<Parameters<typeof Reservation.create>[0]> = {},
): Reservation =>
  Reservation.create({
    id: "res_existing",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    userId: "user_001",
    period: ReservationPeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    ),
    purpose: "既存予約",
    status: ReservationStatus.Reserved,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

const createUseCase = (options: { id?: string; now?: Date } = {}) => {
  const reservationRepository = new InMemoryReservationRepository();
  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const equipmentRepository = new InMemoryEquipmentRepository();
  const resourceUnavailablePeriodRepository =
    new InMemoryResourceUnavailablePeriodRepository();
  const useCase = new CreateReservationUseCase(
    reservationRepository,
    meetingRoomRepository,
    equipmentRepository,
    resourceUnavailablePeriodRepository,
    new FixedIdGenerator(options.id ?? "res_001"),
    new FixedClock(options.now ?? date("2026-06-10T10:00:00+09:00")),
  );

  return {
    useCase,
    reservationRepository,
    meetingRoomRepository,
    equipmentRepository,
    resourceUnavailablePeriodRepository,
  };
};

describe("CreateReservationUseCase", () => {
  it("[正常系] 存在する会議室なら予約を作成できる", async () => {
    const { useCase, meetingRoomRepository, reservationRepository } =
      createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      resourceId: "mr_001",
      userId: "user_001",
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      purpose: "定例ミーティング",
    });

    expect(output.id).toBe("res_001");
    expect(output.status).toBe(ReservationStatus.Reserved);
    expect(await reservationRepository.findById("res_001")).not.toBeNull();
  });

  it("[正常系] 存在する備品なら予約を作成できる", async () => {
    const { useCase, equipmentRepository } = createUseCase();
    await equipmentRepository.save(createEquipment());

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
      resourceId: "eq_001",
      userId: "user_001",
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      purpose: "備品利用",
    });

    expect(output.resourceType).toBe(ResourceType.Equipment);
    expect(output.resourceId).toBe("eq_001");
  });

  it("[異常系] 存在しない会議室は予約できない", async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_missing",
        userId: "user_001",
        startAt: date("2026-06-11T10:00:00+09:00"),
        endAt: date("2026-06-11T11:00:00+09:00"),
        purpose: "定例ミーティング",
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("[異常系] 存在しない備品は予約できない", async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        resourceType: ResourceType.Equipment,
        resourceId: "eq_missing",
        userId: "user_001",
        startAt: date("2026-06-11T10:00:00+09:00"),
        endAt: date("2026-06-11T11:00:00+09:00"),
        purpose: "備品利用",
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("[異常系] 予約開始日時が現在日時以前の場合、予約作成に失敗する", async () => {
    const { useCase, meetingRoomRepository } = createUseCase({
      now: date("2026-06-11T10:00:00+09:00"),
    });
    await meetingRoomRepository.save(createMeetingRoom());

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
        userId: "user_001",
        startAt: date("2026-06-11T10:00:00+09:00"),
        endAt: date("2026-06-11T11:00:00+09:00"),
        purpose: "定例ミーティング",
      }),
    ).rejects.toThrow(ReservationStartAtMustBeFutureError);
  });

  it("[異常系] 重複予約がある場合は予約作成に失敗する", async () => {
    const { useCase, meetingRoomRepository, reservationRepository } =
      createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());
    await reservationRepository.save(createReservation());

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
        userId: "user_002",
        startAt: date("2026-06-11T10:30:00+09:00"),
        endAt: date("2026-06-11T11:30:00+09:00"),
        purpose: "別ミーティング",
      }),
    ).rejects.toThrow(ReservationConflictError);
  });

  it("[正常系] キャンセル済み予約とは重複しても予約作成できる", async () => {
    const { useCase, meetingRoomRepository, reservationRepository } =
      createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());
    await reservationRepository.save(
      createReservation({
        status: ReservationStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      resourceId: "mr_001",
      userId: "user_002",
      startAt: date("2026-06-11T10:30:00+09:00"),
      endAt: date("2026-06-11T11:30:00+09:00"),
      purpose: "別ミーティング",
    });

    expect(output.id).toBe("res_001");
  });
});
