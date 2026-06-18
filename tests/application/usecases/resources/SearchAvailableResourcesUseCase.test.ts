import { describe, expect, it } from "vitest";

import { SearchAvailableResourcesUseCase } from "@application/usecases/resources/SearchAvailableResourcesUseCase";
import { Equipment } from "@domain/entities/Equipment";
import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { Reservation } from "@domain/entities/Reservation";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";
import { InMemoryEquipmentRepository } from "@infrastructure/_repositories/InMemoryEquipmentRepository";
import { InMemoryMeetingRoomRepository } from "@infrastructure/_repositories/InMemoryMeetingRoomRepository";
import { InMemoryReservationRepository } from "@infrastructure/_repositories/InMemoryReservationRepository";
import { InMemoryResourceUnavailablePeriodRepository } from "@infrastructure/_repositories/InMemoryResourceUnavailablePeriodRepository";

const date = (isoString: string): Date => new Date(isoString);

const createMeetingRoom = (
  overrides: Partial<Parameters<typeof MeetingRoom.create>[0]> = {},
): MeetingRoom =>
  MeetingRoom.create({
    id: "mr_001",
    name: "会議室A",
    capacity: 8,
    location: "東京本社 3F",
    description: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

const createEquipment = (
  overrides: Partial<Parameters<typeof Equipment.create>[0]> = {},
): Equipment =>
  Equipment.create({
    id: "eq_001",
    name: "プロジェクターA",
    category: EquipmentCategory.Projector,
    location: "東京本社 2F",
    description: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

const createReservation = (
  overrides: Partial<Parameters<typeof Reservation.create>[0]> = {},
): Reservation =>
  Reservation.create({
    id: "res_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    userId: "user_001",
    period: ReservationPeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    ),
    purpose: "定例ミーティング",
    status: ReservationStatus.Reserved,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

const createResourceUnavailablePeriod = (
  overrides: Partial<Parameters<typeof ResourceUnavailablePeriod.create>[0]> = {},
): ResourceUnavailablePeriod =>
  ResourceUnavailablePeriod.create({
    id: "rup_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    operatorId: "operator_001",
    period: UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    ),
    reason: "メンテナンス",
    status: ResourceUnavailablePeriodStatus.Active,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

const createUseCase = () => {
  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const equipmentRepository = new InMemoryEquipmentRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const resourceUnavailablePeriodRepository =
    new InMemoryResourceUnavailablePeriodRepository();
  const useCase = new SearchAvailableResourcesUseCase(
    meetingRoomRepository,
    equipmentRepository,
    reservationRepository,
    resourceUnavailablePeriodRepository,
  );

  return {
    useCase,
    meetingRoomRepository,
    equipmentRepository,
    reservationRepository,
    resourceUnavailablePeriodRepository,
  };
};

describe("SearchAvailableResourcesUseCase", () => {
  it("[正常系] 指定時間帯で空いている会議室を取得できる", async () => {
    const { useCase, meetingRoomRepository } = createUseCase();
    await meetingRoomRepository.save(createMeetingRoom({ id: "mr_001" }));

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
    });

    expect(output.items).toEqual([
      {
        resourceType: ResourceType.MeetingRoom,
        id: "mr_001",
        name: "会議室A",
        capacity: 8,
        location: "東京本社 3F",
      },
    ]);
  });

  it("[正常系] 指定時間帯で予約済みの会議室は除外される", async () => {
    const { useCase, meetingRoomRepository, reservationRepository } =
      createUseCase();
    await meetingRoomRepository.save(createMeetingRoom({ id: "mr_001" }));
    await meetingRoomRepository.save(
      createMeetingRoom({ id: "mr_002", name: "会議室B" }),
    );
    await reservationRepository.save(
      createReservation({ resourceId: "mr_001" }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      startAt: date("2026-06-11T10:30:00+09:00"),
      endAt: date("2026-06-11T11:30:00+09:00"),
    });

    expect(output.items.map((item) => item.id)).toEqual(["mr_002"]);
  });

  it("[正常系] 収容人数条件で会議室を絞り込める", async () => {
    const { useCase, meetingRoomRepository } = createUseCase();
    await meetingRoomRepository.save(
      createMeetingRoom({ id: "mr_001", capacity: 4 }),
    );
    await meetingRoomRepository.save(
      createMeetingRoom({ id: "mr_002", name: "会議室B", capacity: 8 }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      capacityGte: 6,
    });

    expect(output.items.map((item) => item.id)).toEqual(["mr_002"]);
  });

  it("[正常系] 備品カテゴリで備品を絞り込める", async () => {
    const { useCase, equipmentRepository } = createUseCase();
    await equipmentRepository.save(
      createEquipment({ id: "eq_001", category: EquipmentCategory.Projector }),
    );
    await equipmentRepository.save(
      createEquipment({
        id: "eq_002",
        name: "モニターA",
        category: EquipmentCategory.Monitor,
      }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      category: EquipmentCategory.Monitor,
    });

    expect(output.items.map((item) => item.id)).toEqual(["eq_002"]);
  });

  it("[正常系] 指定時間帯で予約済みの備品は除外される", async () => {
    const { useCase, equipmentRepository, reservationRepository } =
      createUseCase();
    await equipmentRepository.save(createEquipment({ id: "eq_001" }));
    await equipmentRepository.save(
      createEquipment({ id: "eq_002", name: "プロジェクターB" }),
    );
    await reservationRepository.save(
      createReservation({
        resourceType: ResourceType.Equipment,
        resourceId: "eq_001",
      }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
      startAt: date("2026-06-11T10:30:00+09:00"),
      endAt: date("2026-06-11T11:30:00+09:00"),
    });

    expect(output.items.map((item) => item.id)).toEqual(["eq_002"]);
  });

  it("[正常系] 会議室検索では category を無視する", async () => {
    const { useCase, meetingRoomRepository } = createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      category: EquipmentCategory.Projector,
    });

    expect(output.items).toHaveLength(1);
  });

  it("[正常系] 備品検索では capacityGte を無視する", async () => {
    const { useCase, equipmentRepository } = createUseCase();
    await equipmentRepository.save(createEquipment());

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      capacityGte: 100,
    });

    expect(output.items).toHaveLength(1);
  });

  it("[正常系] 有効な利用停止枠と重複する会議室は除外される", async () => {
    const {
      useCase,
      meetingRoomRepository,
      resourceUnavailablePeriodRepository,
    } = createUseCase();
    await meetingRoomRepository.save(createMeetingRoom({ id: "mr_001" }));
    await meetingRoomRepository.save(
      createMeetingRoom({ id: "mr_002", name: "会議室B" }),
    );
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod({ resourceId: "mr_001" }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      startAt: date("2026-06-11T10:30:00+09:00"),
      endAt: date("2026-06-11T11:30:00+09:00"),
    });

    expect(output.items.map((item) => item.id)).toEqual(["mr_002"]);
  });

  it("[正常系] 有効な利用停止枠と重複する備品は除外される", async () => {
    const {
      useCase,
      equipmentRepository,
      resourceUnavailablePeriodRepository,
    } = createUseCase();
    await equipmentRepository.save(createEquipment({ id: "eq_001" }));
    await equipmentRepository.save(
      createEquipment({ id: "eq_002", name: "プロジェクターB" }),
    );
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod({
        resourceType: ResourceType.Equipment,
        resourceId: "eq_001",
      }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
      startAt: date("2026-06-11T10:30:00+09:00"),
      endAt: date("2026-06-11T11:30:00+09:00"),
    });

    expect(output.items.map((item) => item.id)).toEqual(["eq_002"]);
  });

  it("[正常系] キャンセル済み利用停止枠のみがあるリソースは除外されない", async () => {
    const {
      useCase,
      meetingRoomRepository,
      resourceUnavailablePeriodRepository,
    } = createUseCase();
    await meetingRoomRepository.save(createMeetingRoom({ id: "mr_001" }));
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod({
        status: ResourceUnavailablePeriodStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      }),
    );

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      startAt: date("2026-06-11T10:30:00+09:00"),
      endAt: date("2026-06-11T11:30:00+09:00"),
    });

    expect(output.items.map((item) => item.id)).toEqual(["mr_001"]);
  });
});
