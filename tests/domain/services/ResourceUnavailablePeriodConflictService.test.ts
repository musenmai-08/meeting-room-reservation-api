import { describe, expect, it } from "vitest";

import { Reservation } from "@domain/entities/Reservation";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceUnavailablePeriodConflictService } from "@domain/services/ResourceUnavailablePeriodConflictService";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";

const date = (isoString: string): Date => new Date(isoString);

const createUnavailablePeriod = (
  startAt = "2026-06-11T10:00:00+09:00",
  endAt = "2026-06-11T11:00:00+09:00",
): UnavailablePeriod => UnavailablePeriod.create(date(startAt), date(endAt));

const createReservationPeriod = (
  startAt = "2026-06-11T10:00:00+09:00",
  endAt = "2026-06-11T11:00:00+09:00",
): ReservationPeriod => ReservationPeriod.create(date(startAt), date(endAt));

const createResourceUnavailablePeriod = (
  overrides: Partial<Parameters<typeof ResourceUnavailablePeriod.create>[0]> = {},
): ResourceUnavailablePeriod =>
  ResourceUnavailablePeriod.create({
    id: "rup_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    operatorId: "operator_001",
    period: createUnavailablePeriod(),
    reason: "メンテナンス",
    status: ResourceUnavailablePeriodStatus.Active,
    cancelledAt: null,
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
    period: createReservationPeriod(),
    purpose: "定例ミーティング",
    status: ReservationStatus.Reserved,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("ResourceUnavailablePeriodConflictService", () => {
  it("[正常系] 有効な利用停止枠と新規利用停止期間が重なる場合は conflict になる", () => {
    const hasConflict =
      ResourceUnavailablePeriodConflictService.hasConflictWithUnavailablePeriods(
        [createResourceUnavailablePeriod()],
        createUnavailablePeriod(
          "2026-06-11T10:30:00+09:00",
          "2026-06-11T11:30:00+09:00",
        ),
      );

    expect(hasConflict).toBe(true);
  });

  it("[正常系] キャンセル済み利用停止枠は conflict 判定から除外される", () => {
    const hasConflict =
      ResourceUnavailablePeriodConflictService.hasConflictWithUnavailablePeriods(
        [
          createResourceUnavailablePeriod({
            status: ResourceUnavailablePeriodStatus.Cancelled,
            cancelledAt: date("2026-06-10T12:00:00+09:00"),
          }),
        ],
        createUnavailablePeriod(
          "2026-06-11T10:30:00+09:00",
          "2026-06-11T11:30:00+09:00",
        ),
      );

    expect(hasConflict).toBe(false);
  });

  it("[正常系] 有効予約と新規利用停止期間が重なる場合は conflict になる", () => {
    const hasConflict =
      ResourceUnavailablePeriodConflictService.hasConflictWithReservations(
        [createReservation()],
        createUnavailablePeriod(
          "2026-06-11T10:30:00+09:00",
          "2026-06-11T11:30:00+09:00",
        ),
      );

    expect(hasConflict).toBe(true);
  });

  it("[正常系] キャンセル済み予約は conflict 判定から除外される", () => {
    const hasConflict =
      ResourceUnavailablePeriodConflictService.hasConflictWithReservations(
        [
          createReservation({
            status: ReservationStatus.Cancelled,
            cancelledAt: date("2026-06-10T12:00:00+09:00"),
          }),
        ],
        createUnavailablePeriod(
          "2026-06-11T10:30:00+09:00",
          "2026-06-11T11:30:00+09:00",
        ),
      );

    expect(hasConflict).toBe(false);
  });
});
