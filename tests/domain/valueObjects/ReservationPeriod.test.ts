import { describe, expect, it } from "vitest";

import { InvalidReservationPeriodError } from "../../../src/domain/errors/ReservationErrors";
import { ReservationPeriod } from "../../../src/domain/valueObjects/ReservationPeriod";

const date = (isoString: string): Date => new Date(isoString);

describe("ReservationPeriod", () => {
  describe("create", () => {
    it("[正常系] 開始日時が終了日時より前の場合、ReservationPeriod を生成できる", () => {
      const startAt = date("2026-06-11T10:00:00+09:00");
      const endAt = date("2026-06-11T11:00:00+09:00");

      const period = ReservationPeriod.create(startAt, endAt);

      expect(period.startAt).toEqual(startAt);
      expect(period.endAt).toEqual(endAt);
    });

    it("[異常系] 開始日時と終了日時が同じ場合、エラーになる", () => {
      const startAt = date("2026-06-11T10:00:00+09:00");
      const endAt = date("2026-06-11T10:00:00+09:00");

      expect(() => ReservationPeriod.create(startAt, endAt)).toThrow(
        InvalidReservationPeriodError,
      );
    });

    it("[異常系] 開始日時が終了日時より後の場合、エラーになる", () => {
      const startAt = date("2026-06-11T11:00:00+09:00");
      const endAt = date("2026-06-11T10:00:00+09:00");

      expect(() => ReservationPeriod.create(startAt, endAt)).toThrow(
        InvalidReservationPeriodError,
      );
    });

    it("[異常系] 開始日時が不正な Date の場合、エラーになる", () => {
      const startAt = date("invalid");
      const endAt = date("2026-06-11T11:00:00+09:00");

      expect(() => ReservationPeriod.create(startAt, endAt)).toThrow(
        InvalidReservationPeriodError,
      );
    });

    it("[異常系] 終了日時が不正な Date の場合、エラーになる", () => {
      const startAt = date("2026-06-11T10:00:00+09:00");
      const endAt = date("invalid");

      expect(() => ReservationPeriod.create(startAt, endAt)).toThrow(
        InvalidReservationPeriodError,
      );
    });

    it("[正常系] 生成後に元の Date を変更しても、ReservationPeriod の値は変わらない", () => {
      const startAt = date("2026-06-11T10:00:00+09:00");
      const endAt = date("2026-06-11T11:00:00+09:00");
      const period = ReservationPeriod.create(startAt, endAt);

      startAt.setHours(20);
      endAt.setHours(21);

      expect(period.startAt).toEqual(date("2026-06-11T10:00:00+09:00"));
      expect(period.endAt).toEqual(date("2026-06-11T11:00:00+09:00"));
    });

    it("[正常系] 取得した Date を変更しても、ReservationPeriod の内部値は変わらない", () => {
      const period = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );

      const startAt = period.startAt;
      const endAt = period.endAt;
      startAt.setHours(20);
      endAt.setHours(21);

      expect(period.startAt).toEqual(date("2026-06-11T10:00:00+09:00"));
      expect(period.endAt).toEqual(date("2026-06-11T11:00:00+09:00"));
    });
  });

  describe("overlaps", () => {
    it("[正常系] 完全に同じ時間帯の場合、重複する", () => {
      const existingPeriod = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );
      const newPeriod = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );

      expect(existingPeriod.overlaps(newPeriod)).toBe(true);
    });

    it("[正常系] 一部だけ重なる時間帯の場合、重複する", () => {
      const existingPeriod = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );
      const newPeriod = ReservationPeriod.create(
        date("2026-06-11T10:30:00+09:00"),
        date("2026-06-11T11:30:00+09:00"),
      );

      expect(existingPeriod.overlaps(newPeriod)).toBe(true);
    });

    it("[正常系] 既存予約の終了時刻と新規予約の開始時刻が一致する場合、重複しない", () => {
      const existingPeriod = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );
      const newPeriod = ReservationPeriod.create(
        date("2026-06-11T11:00:00+09:00"),
        date("2026-06-11T12:00:00+09:00"),
      );

      expect(existingPeriod.overlaps(newPeriod)).toBe(false);
    });

    it("[正常系] 新規予約の終了時刻と既存予約の開始時刻が一致する場合、重複しない", () => {
      const existingPeriod = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );
      const newPeriod = ReservationPeriod.create(
        date("2026-06-11T09:00:00+09:00"),
        date("2026-06-11T10:00:00+09:00"),
      );

      expect(existingPeriod.overlaps(newPeriod)).toBe(false);
    });
  });

  describe("isStartedAtOrBefore", () => {
    it("[正常系] 指定日時が開始日時より前の場合、開始済みではない", () => {
      const period = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );

      expect(period.isStartedAtOrBefore(date("2026-06-11T09:59:59+09:00"))).toBe(
        false,
      );
    });

    it("[正常系] 指定日時が開始日時と同じ場合、開始済みとして扱う", () => {
      const period = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );

      expect(period.isStartedAtOrBefore(date("2026-06-11T10:00:00+09:00"))).toBe(
        true,
      );
    });

    it("[正常系] 指定日時が開始日時より後の場合、開始済みとして扱う", () => {
      const period = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );

      expect(period.isStartedAtOrBefore(date("2026-06-11T10:00:01+09:00"))).toBe(
        true,
      );
    });

    it("[異常系] 指定日時が不正な Date の場合、エラーになる", () => {
      const period = ReservationPeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T11:00:00+09:00"),
      );

      expect(() => period.isStartedAtOrBefore(date("invalid"))).toThrow(
        InvalidReservationPeriodError,
      );
    });
  });
});
