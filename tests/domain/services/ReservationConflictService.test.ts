import { describe, expect, it } from "vitest";

import { Reservation } from "@domain/entities/Reservation";
import { ReservationConflictService } from "@domain/services/ReservationConflictService";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

// Reservation.create に渡す入力型 ということを意図した型にしたいので、
// Reservation.ts の type ReservationProps を export せず、以下のように型を取得している
type ReservationFactoryProps = Parameters<typeof Reservation.create>[0];

const date = (isoString: string): Date => new Date(isoString);

const createPeriod = (startAt: string, endAt: string): ReservationPeriod =>
  ReservationPeriod.create(date(startAt), date(endAt));

const createTestReservation = (
  overrides: Partial<ReservationFactoryProps> = {},
): Reservation =>
  Reservation.create({
    id: "res_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    userId: "user_001",
    period: createPeriod(
      "2026-06-11T10:00:00+09:00",
      "2026-06-11T11:00:00+09:00",
    ),
    purpose: "定例ミーティング",
    status: ReservationStatus.Reserved,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("ReservationConflictService", () => {
  it("[正常系] 有効予約と新規予約が重なる場合、conflict になる", () => {
    const existingReservations = [createTestReservation()];
    const newPeriod = createPeriod(
      "2026-06-11T10:30:00+09:00",
      "2026-06-11T11:30:00+09:00",
    );

    const hasConflict = ReservationConflictService.hasConflict(
      existingReservations,
      newPeriod,
    );

    expect(hasConflict).toBe(true);
  });

  it("[正常系] 有効予約と新規予約が重ならない場合、conflict にならない", () => {
    const existingReservations = [createTestReservation()];
    const newPeriod = createPeriod(
      "2026-06-11T12:00:00+09:00",
      "2026-06-11T13:00:00+09:00",
    );

    const hasConflict = ReservationConflictService.hasConflict(
      existingReservations,
      newPeriod,
    );

    expect(hasConflict).toBe(false);
  });

  it("[正常系] 終了時刻と開始時刻が一致する場合、conflict にならない", () => {
    const existingReservations = [createTestReservation()];
    const newPeriod = createPeriod(
      "2026-06-11T11:00:00+09:00",
      "2026-06-11T12:00:00+09:00",
    );

    const hasConflict = ReservationConflictService.hasConflict(
      existingReservations,
      newPeriod,
    );

    expect(hasConflict).toBe(false);
  });

  it("[正常系] キャンセル済み予約は重複判定から除外される", () => {
    const existingReservations = [
      createTestReservation({
        status: ReservationStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      }),
    ];
    const newPeriod = createPeriod(
      "2026-06-11T10:30:00+09:00",
      "2026-06-11T11:30:00+09:00",
    );

    const hasConflict = ReservationConflictService.hasConflict(
      existingReservations,
      newPeriod,
    );

    expect(hasConflict).toBe(false);
  });

  it("[正常系] 複数の予約のうち1件でも有効予約が重なる場合、conflict になる", () => {
    const existingReservations = [
      createTestReservation({
        id: "res_001",
        period: createPeriod(
          "2026-06-11T08:00:00+09:00",
          "2026-06-11T09:00:00+09:00",
        ),
      }),
      createTestReservation({
        id: "res_002",
        period: createPeriod(
          "2026-06-11T10:00:00+09:00",
          "2026-06-11T11:00:00+09:00",
        ),
      }),
    ];
    const newPeriod = createPeriod(
      "2026-06-11T10:30:00+09:00",
      "2026-06-11T11:30:00+09:00",
    );

    const hasConflict = ReservationConflictService.hasConflict(
      existingReservations,
      newPeriod,
    );

    expect(hasConflict).toBe(true);
  });
});
