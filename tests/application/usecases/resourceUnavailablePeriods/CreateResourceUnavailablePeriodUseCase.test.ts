import { describe, expect, it } from "vitest";

import { ResourceNotFoundError } from "@application/errors/ResourceApplicationErrors";
import {
  ResourceUnavailablePeriodConflictError,
  ResourceUnavailablePeriodReservationConflictError,
  ResourceUnavailablePeriodStartAtMustBeFutureError,
} from "@application/errors/ResourceUnavailablePeriodError";
import { type Clock } from "@application/services/Clock";
import { type IdGenerator } from "@application/services/IdGenerator";
import { CreateResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CreateResourceUnavailablePeriodUseCase";
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

const createReservation = (): Reservation =>
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
  });

const createResourceUnavailablePeriod = (): ResourceUnavailablePeriod =>
  ResourceUnavailablePeriod.create({
    id: "rup_existing",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    operatorId: "operator_001",
    period: UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    ),
    reason: "既存メンテナンス",
    status: ResourceUnavailablePeriodStatus.Active,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
  });

const createUseCase = () => {
  const resourceUnavailablePeriodRepository =
    new InMemoryResourceUnavailablePeriodRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const equipmentRepository = new InMemoryEquipmentRepository();
  const useCase = new CreateResourceUnavailablePeriodUseCase(
    resourceUnavailablePeriodRepository,
    reservationRepository,
    meetingRoomRepository,
    equipmentRepository,
    new FixedIdGenerator("rup_001"),
    new FixedClock(date("2026-06-10T10:00:00+09:00")),
  );

  return {
    useCase,
    resourceUnavailablePeriodRepository,
    reservationRepository,
    meetingRoomRepository,
    equipmentRepository,
  };
};

describe("CreateResourceUnavailablePeriodUseCase", () => {
  it("[正常系] 存在する会議室なら利用停止枠を作成できる", async () => {
    const { useCase, meetingRoomRepository, resourceUnavailablePeriodRepository } =
      createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
      resourceId: "mr_001",
      operatorId: "operator_001",
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      reason: "メンテナンス",
    });

    expect(output.id).toBe("rup_001");
    expect(output.status).toBe(ResourceUnavailablePeriodStatus.Active);
    expect(
      await resourceUnavailablePeriodRepository.findById("rup_001"),
    ).not.toBeNull();
  });

  it("[正常系] 存在する備品なら利用停止枠を作成できる", async () => {
    const { useCase, equipmentRepository } = createUseCase();
    await equipmentRepository.save(createEquipment());

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
      resourceId: "eq_001",
      operatorId: "operator_001",
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      reason: "メンテナンス",
    });

    expect(output.resourceType).toBe(ResourceType.Equipment);
    expect(output.resourceId).toBe("eq_001");
  });

  it("[異常系] 存在しないリソースは利用停止枠を作成できない", async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_missing",
        operatorId: "operator_001",
        startAt: date("2026-06-11T10:00:00+09:00"),
        endAt: date("2026-06-11T11:00:00+09:00"),
        reason: "メンテナンス",
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("[異常系] 存在しない備品は利用停止枠を作成できない", async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        resourceType: ResourceType.Equipment,
        resourceId: "eq_missing",
        operatorId: "operator_001",
        startAt: date("2026-06-11T10:00:00+09:00"),
        endAt: date("2026-06-11T11:00:00+09:00"),
        reason: "メンテナンス",
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("[異常系] 開始日時が現在日時以前の場合は作成できない", async () => {
    const { useCase, meetingRoomRepository } = createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
        operatorId: "operator_001",
        startAt: date("2026-06-10T10:00:00+09:00"),
        endAt: date("2026-06-10T11:00:00+09:00"),
        reason: "メンテナンス",
      }),
    ).rejects.toThrow(ResourceUnavailablePeriodStartAtMustBeFutureError);
  });

  it("[異常系] 有効な利用停止枠と重複する場合は作成できない", async () => {
    const {
      useCase,
      meetingRoomRepository,
      resourceUnavailablePeriodRepository,
    } = createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod(),
    );

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
        operatorId: "operator_001",
        startAt: date("2026-06-11T10:30:00+09:00"),
        endAt: date("2026-06-11T11:30:00+09:00"),
        reason: "メンテナンス",
      }),
    ).rejects.toThrow(ResourceUnavailablePeriodConflictError);
  });

  it("[異常系] 有効予約と重複する場合は作成できない", async () => {
    const { useCase, meetingRoomRepository, reservationRepository } =
      createUseCase();
    await meetingRoomRepository.save(createMeetingRoom());
    await reservationRepository.save(createReservation());

    await expect(
      useCase.execute({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
        operatorId: "operator_001",
        startAt: date("2026-06-11T10:30:00+09:00"),
        endAt: date("2026-06-11T11:30:00+09:00"),
        reason: "メンテナンス",
      }),
    ).rejects.toThrow(ResourceUnavailablePeriodReservationConflictError);
  });
});
