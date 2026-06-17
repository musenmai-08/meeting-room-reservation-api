import { describe, expect, it } from "vitest";

import { ReservationNotFoundError } from "@application/errors/ReservationApplicationErrors";
import { type Clock } from "@application/services/Clock";
import { CancelReservationUseCase } from "@application/usecases/reservations/CancelReservationUseCase";
import {
  AlreadyCancelledError,
  ReservationCancellationForbiddenError,
} from "@domain/errors/ReservationErrors";
import { Reservation } from "@domain/entities/Reservation";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { InMemoryReservationRepository } from "@infrastructure/_repositories/InMemoryReservationRepository";

class FixedClock implements Clock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

const date = (isoString: string): Date => new Date(isoString);

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

describe("CancelReservationUseCase", () => {
  it("[正常系] 予約者本人ならキャンセルできる", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation());
    const useCase = new CancelReservationUseCase(
      repository,
      new FixedClock(date("2026-06-10T12:00:00+09:00")),
    );

    const output = await useCase.execute({
      reservationId: "res_001",
      userId: "user_001",
    });

    expect(output.status).toBe(ReservationStatus.Cancelled);
    expect(output.cancelledAt).toEqual(date("2026-06-10T12:00:00+09:00"));
  });

  it("[異常系] 他人の予約はキャンセルできない", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation());
    const useCase = new CancelReservationUseCase(
      repository,
      new FixedClock(date("2026-06-10T12:00:00+09:00")),
    );

    await expect(
      useCase.execute({ reservationId: "res_001", userId: "user_999" }),
    ).rejects.toThrow(ReservationCancellationForbiddenError);
  });

  it("[異常系] 存在しない予約はキャンセルできない", async () => {
    const repository = new InMemoryReservationRepository();
    const useCase = new CancelReservationUseCase(
      repository,
      new FixedClock(date("2026-06-10T12:00:00+09:00")),
    );

    await expect(
      useCase.execute({ reservationId: "res_missing", userId: "user_001" }),
    ).rejects.toThrow(ReservationNotFoundError);
  });

  it("[異常系] キャンセル済み予約はキャンセルできない", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(
      createReservation({
        status: ReservationStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      }),
    );
    const useCase = new CancelReservationUseCase(
      repository,
      new FixedClock(date("2026-06-10T13:00:00+09:00")),
    );

    await expect(
      useCase.execute({ reservationId: "res_001", userId: "user_001" }),
    ).rejects.toThrow(AlreadyCancelledError);
  });

  it("[正常系] キャンセルした予約を Repository に保存する", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation());
    const useCase = new CancelReservationUseCase(
      repository,
      new FixedClock(date("2026-06-10T12:00:00+09:00")),
    );

    await useCase.execute({ reservationId: "res_001", userId: "user_001" });
    const savedReservation = await repository.findById("res_001");

    expect(savedReservation?.status).toBe(ReservationStatus.Cancelled);
    expect(savedReservation?.cancelledAt).toEqual(
      date("2026-06-10T12:00:00+09:00"),
    );
  });
});
