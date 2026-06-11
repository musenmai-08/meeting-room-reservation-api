import { describe, expect, it } from "vitest";

import { Reservation } from "../../../src/domain/entities/Reservation";
import {
  AlreadyCancelledError,
  CannotCancelPastReservationError,
  InvalidReservationError,
  ReservationCancellationForbiddenError,
} from "../../../src/domain/errors/ReservationErrors";
import { ReservationPeriod } from "../../../src/domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "../../../src/domain/valueObjects/ReservationStatus";
import { ResourceType } from "../../../src/domain/valueObjects/ResourceType";

// Reservation.create に渡す入力型 ということを意図した型にしたいので、
// Reservation.ts の type ReservationProps を export せず、以下のように型を取得している
type ReservationFactoryProps = Parameters<typeof Reservation.create>[0];

const date = (isoString: string): Date => new Date(isoString);

const createTestPeriod = (): ReservationPeriod =>
  ReservationPeriod.create(
    date("2026-06-11T10:00:00+09:00"),
    date("2026-06-11T11:00:00+09:00"),
  );

const createTestReservation = (
  overrides: Partial<ReservationFactoryProps> = {},
): Reservation =>
  Reservation.create({
    id: "res_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    userId: "user_001",
    period: createTestPeriod(),
    purpose: "定例ミーティング",
    status: ReservationStatus.Reserved,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("Reservation", () => {
  describe("create", () => {
    it("[正常系] 有効な値の場合、Reservation を生成できる", () => {
      const reservation = createTestReservation();

      expect(reservation.id).toBe("res_001");
      expect(reservation.resourceType).toBe(ResourceType.MeetingRoom);
      expect(reservation.resourceId).toBe("mr_001");
      expect(reservation.userId).toBe("user_001");
      expect(reservation.purpose).toBe("定例ミーティング");
      expect(reservation.status).toBe(ReservationStatus.Reserved);
      expect(reservation.cancelledAt).toBeNull();
      expect(reservation.isReserved()).toBe(true);
      expect(reservation.isCancelled()).toBe(false);
    });

    it("[正常系] purpose が 1 文字の場合、Reservation を生成できる", () => {
      const reservation = createTestReservation({ purpose: "A" });

      expect(reservation.purpose).toBe("A");
    });

    it("[正常系] purpose が 200 文字の場合、Reservation を生成できる", () => {
      const purpose = "A".repeat(200);

      const reservation = createTestReservation({ purpose });

      expect(reservation.purpose).toBe(purpose);
    });

    it("[正常系] purpose の前後に空白がある場合、trim して保持する", () => {
      const reservation = createTestReservation({ purpose: "  会議  " });

      expect(reservation.purpose).toBe("会議");
    });

    it("[異常系] id が空の場合、エラーになる", () => {
      expect(() => createTestReservation({ id: " " })).toThrow(
        InvalidReservationError,
      );
    });

    it("[異常系] resourceType が定義外の場合、エラーになる", () => {
      expect(() =>
        createTestReservation({
          resourceType: "UNKNOWN" as unknown as ResourceType,
        }),
      ).toThrow(InvalidReservationError);
    });

    it("[異常系] resourceId が空の場合、エラーになる", () => {
      expect(() => createTestReservation({ resourceId: " " })).toThrow(
        InvalidReservationError,
      );
    });

    it("[異常系] userId が空の場合、エラーになる", () => {
      expect(() => createTestReservation({ userId: " " })).toThrow(
        InvalidReservationError,
      );
    });

    it("[異常系] purpose が空の場合、エラーになる", () => {
      expect(() => createTestReservation({ purpose: " " })).toThrow(
        InvalidReservationError,
      );
    });

    it("[異常系] purpose が 201 文字の場合、エラーになる", () => {
      expect(() => createTestReservation({ purpose: "A".repeat(201) })).toThrow(
        InvalidReservationError,
      );
    });

    it("[異常系] 予約中なのに cancelledAt が入っている場合、エラーになる", () => {
      expect(() =>
        createTestReservation({
          status: ReservationStatus.Reserved,
          cancelledAt: date("2026-06-10T12:00:00+09:00"),
        }),
      ).toThrow(InvalidReservationError);
    });

    it("[異常系] キャンセル済みなのに cancelledAt が null の場合、エラーになる", () => {
      expect(() =>
        createTestReservation({
          status: ReservationStatus.Cancelled,
          cancelledAt: null,
        }),
      ).toThrow(InvalidReservationError);
    });

    it("[異常系] キャンセル済みで cancelledAt が不正な Date の場合、エラーになる", () => {
      expect(() =>
        createTestReservation({
          status: ReservationStatus.Cancelled,
          cancelledAt: date("invalid"),
        }),
      ).toThrow(InvalidReservationError);
    });

    it("[異常系] createdAt が不正な Date の場合、エラーになる", () => {
      expect(() =>
        createTestReservation({ createdAt: date("invalid") }),
      ).toThrow(InvalidReservationError);
    });

    it("[異常系] updatedAt が不正な Date の場合、エラーになる", () => {
      expect(() =>
        createTestReservation({ updatedAt: date("invalid") }),
      ).toThrow(InvalidReservationError);
    });

    it("[正常系] Date の getter は clone を返す", () => {
      const reservation = createTestReservation({
        status: ReservationStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      });

      const cancelledAt = reservation.cancelledAt;
      const createdAt = reservation.createdAt;
      const updatedAt = reservation.updatedAt;
      cancelledAt?.setHours(20);
      createdAt.setHours(20);
      updatedAt.setHours(20);

      expect(reservation.cancelledAt).toEqual(
        date("2026-06-10T12:00:00+09:00"),
      );
      expect(reservation.createdAt).toEqual(date("2026-06-10T10:00:00+09:00"));
      expect(reservation.updatedAt).toEqual(date("2026-06-10T10:00:00+09:00"));
    });
  });

  describe("cancel", () => {
    it("[正常系] 予約中の予約は本人ならキャンセルできる", () => {
      const reservation = createTestReservation();
      const cancelledAt = date("2026-06-10T12:00:00+09:00");

      const cancelledReservation = reservation.cancel("user_001", cancelledAt);

      expect(cancelledReservation.status).toBe(ReservationStatus.Cancelled);
      expect(cancelledReservation.cancelledAt).toEqual(cancelledAt);
      expect(cancelledReservation.updatedAt).toEqual(cancelledAt);
      expect(cancelledReservation.isCancelled()).toBe(true);
    });

    it("[異常系] 他人の予約はキャンセルできない", () => {
      const reservation = createTestReservation();

      expect(() =>
        reservation.cancel("user_999", date("2026-06-10T12:00:00+09:00")),
      ).toThrow(ReservationCancellationForbiddenError);
    });

    it("[異常系] キャンセル済み予約は再度キャンセルできない", () => {
      const reservation = createTestReservation({
        status: ReservationStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      });

      expect(() =>
        reservation.cancel("user_001", date("2026-06-10T13:00:00+09:00")),
      ).toThrow(AlreadyCancelledError);
    });

    it("[異常系] 現在日時が予約開始日時と同じ場合、キャンセルできない", () => {
      const reservation = createTestReservation();

      expect(() =>
        reservation.cancel("user_001", date("2026-06-11T10:00:00+09:00")),
      ).toThrow(CannotCancelPastReservationError);
    });

    it("[異常系] 現在日時が予約開始日時より後の場合、キャンセルできない", () => {
      const reservation = createTestReservation();

      expect(() =>
        reservation.cancel("user_001", date("2026-06-11T10:00:01+09:00")),
      ).toThrow(CannotCancelPastReservationError);
    });

    it("[異常系] cancelledAt が不正な Date の場合、エラーになる", () => {
      const reservation = createTestReservation();

      expect(() => reservation.cancel("user_001", date("invalid"))).toThrow(
        InvalidReservationError,
      );
    });
  });

  describe("equals", () => {
    it("[正常系] id が同じ場合、同じ Entity として扱う", () => {
      const reservation = createTestReservation({ id: "res_001" });
      const otherReservation = createTestReservation({
        id: "res_001",
        resourceId: "mr_999",
      });

      expect(reservation.equals(otherReservation)).toBe(true);
    });

    it("[正常系] id が異なる場合、別の Entity として扱う", () => {
      const reservation = createTestReservation({ id: "res_001" });
      const otherReservation = createTestReservation({ id: "res_002" });

      expect(reservation.equals(otherReservation)).toBe(false);
    });
  });
});
