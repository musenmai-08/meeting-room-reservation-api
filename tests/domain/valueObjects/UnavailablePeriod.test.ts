import { describe, expect, it } from "vitest";

import { InvalidUnavailablePeriodError } from "@domain/errors/ResourceUnavailablePeriodErrors";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";

const date = (isoString: string): Date => new Date(isoString);

describe("UnavailablePeriod", () => {
  it("[正常系] 開始日時が終了日時より前の場合、生成できる", () => {
    const period = UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    );

    expect(period.startAt).toEqual(date("2026-06-11T10:00:00+09:00"));
    expect(period.endAt).toEqual(date("2026-06-11T11:00:00+09:00"));
  });

  it("[異常系] 開始日時と終了日時が同じ場合、生成できない", () => {
    expect(() =>
      UnavailablePeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        date("2026-06-11T10:00:00+09:00"),
      ),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] 開始日時が不正な Date の場合、生成できない", () => {
    expect(() =>
      UnavailablePeriod.create(
        new Date("invalid-date"),
        date("2026-06-11T11:00:00+09:00"),
      ),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] 終了日時が不正な Date の場合、生成できない", () => {
    expect(() =>
      UnavailablePeriod.create(
        date("2026-06-11T10:00:00+09:00"),
        new Date("invalid-date"),
      ),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] 開始日時が終了日時より後の場合、生成できない", () => {
    expect(() =>
      UnavailablePeriod.create(
        date("2026-06-11T11:00:00+09:00"),
        date("2026-06-11T10:00:00+09:00"),
      ),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[正常系] 一部だけ重なる時間帯は重複する", () => {
    const period = UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    );
    const other = UnavailablePeriod.create(
      date("2026-06-11T10:30:00+09:00"),
      date("2026-06-11T11:30:00+09:00"),
    );

    expect(period.overlaps(other)).toBe(true);
  });

  it("[正常系] 終了時刻と開始時刻が一致する場合、重複しない", () => {
    const period = UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    );
    const other = UnavailablePeriod.create(
      date("2026-06-11T11:00:00+09:00"),
      date("2026-06-11T12:00:00+09:00"),
    );

    expect(period.overlaps(other)).toBe(false);
  });

  it("[正常系] 指定日時が開始日時以降の場合、開始済みとして判定できる", () => {
    const period = UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    );

    expect(period.isStartedAtOrBefore(date("2026-06-11T10:00:00+09:00"))).toBe(
      true,
    );
  });

  it("[異常系] 開始済み判定の指定日時が不正な Date の場合、エラー", () => {
    const period = UnavailablePeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    );

    expect(() => period.isStartedAtOrBefore(new Date("invalid-date"))).toThrow(
      InvalidUnavailablePeriodError,
    );
  });
});
