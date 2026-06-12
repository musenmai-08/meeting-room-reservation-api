import { describe, expect, it } from "vitest";

import { ReservationNotFoundError } from "@application/errors/ReservationApplicationErrors";
import { GetReservationUseCase } from "@application/usecases/reservations/GetReservationUseCase";
import { Reservation } from "@domain/entities/Reservation";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { InMemoryReservationRepository } from "@infrastructure/repositories/InMemoryReservationRepository";

const date = (isoString: string): Date => new Date(isoString);

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

describe("GetReservationUseCase", () => {
  it("[正常系] 存在する予約の詳細を取得できる", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation());
    const useCase = new GetReservationUseCase(repository);

    const output = await useCase.execute({ reservationId: "res_001" });

    expect(output.id).toBe("res_001");
    expect(output.startAt).toEqual(date("2026-06-11T10:00:00+09:00"));
    expect(output.endAt).toEqual(date("2026-06-11T11:00:00+09:00"));
  });

  it("[異常系] 存在しない予約は取得できない", async () => {
    const repository = new InMemoryReservationRepository();
    const useCase = new GetReservationUseCase(repository);

    await expect(
      useCase.execute({ reservationId: "res_missing" }),
    ).rejects.toThrow(ReservationNotFoundError);
  });

  it("[正常系] UseCase の出力が詳細用 DTO の形になる", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation());
    const useCase = new GetReservationUseCase(repository);

    const output = await useCase.execute({ reservationId: "res_001" });

    expect(output).toEqual({
      id: "res_001",
      resourceType: ResourceType.MeetingRoom,
      resourceId: "mr_001",
      userId: "user_001",
      startAt: date("2026-06-11T10:00:00+09:00"),
      endAt: date("2026-06-11T11:00:00+09:00"),
      purpose: "定例ミーティング",
      status: ReservationStatus.Reserved,
      cancelledAt: null,
      createdAt: date("2026-06-10T10:00:00+09:00"),
      updatedAt: date("2026-06-10T10:00:00+09:00"),
    });
  });
});

