import { describe, expect, it } from "vitest";

import {
  CannotCancelStartedResourceUnavailablePeriodError,
  InvalidUnavailablePeriodError,
  ResourceUnavailablePeriodAlreadyCancelledError,
} from "@domain/errors/ResourceUnavailablePeriodErrors";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";

type ResourceUnavailablePeriodProps = Parameters<
  typeof ResourceUnavailablePeriod.create
>[0];

const date = (isoString: string): Date => new Date(isoString);

const createPeriod = (
  startAt = "2026-06-11T10:00:00+09:00",
  endAt = "2026-06-11T11:00:00+09:00",
): UnavailablePeriod => UnavailablePeriod.create(date(startAt), date(endAt));

const createTestResourceUnavailablePeriod = (
  overrides: Partial<ResourceUnavailablePeriodProps> = {},
): ResourceUnavailablePeriod =>
  ResourceUnavailablePeriod.create({
    id: "rup_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    operatorId: "operator_001",
    period: createPeriod(),
    reason: "メンテナンス",
    status: ResourceUnavailablePeriodStatus.Active,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("ResourceUnavailablePeriod", () => {
  it("[正常系] 有効な値なら生成できる", () => {
    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod();

    expect(resourceUnavailablePeriod.id).toBe("rup_001");
    expect(resourceUnavailablePeriod.operatorId).toBe("operator_001");
    expect(resourceUnavailablePeriod.status).toBe(
      ResourceUnavailablePeriodStatus.Active,
    );
  });

  it("[正常系] reason は trim される", () => {
    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod({
      reason: "  メンテナンス  ",
    });

    expect(resourceUnavailablePeriod.reason).toBe("メンテナンス");
  });

  it("[異常系] id が空ならエラー", () => {
    expect(() => createTestResourceUnavailablePeriod({ id: " " })).toThrow(
      InvalidUnavailablePeriodError,
    );
  });

  it("[異常系] resourceType が不正ならエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({
        resourceType: "INVALID" as ResourceType,
      }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] resourceId が空ならエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({ resourceId: " " }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] operatorId が空ならエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({ operatorId: " " }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] reason が空ならエラー", () => {
    expect(() => createTestResourceUnavailablePeriod({ reason: " " })).toThrow(
      InvalidUnavailablePeriodError,
    );
  });

  it("[正常系] reason が 200 文字なら生成できる", () => {
    const reason = "a".repeat(200);

    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod({
      reason,
    });

    expect(resourceUnavailablePeriod.reason).toBe(reason);
  });

  it("[異常系] reason が 201 文字ならエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({ reason: "a".repeat(201) }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] ACTIVE なのに cancelledAt がある場合はエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({
        status: ResourceUnavailablePeriodStatus.Active,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] CANCELLED なのに cancelledAt がない場合はエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({
        status: ResourceUnavailablePeriodStatus.Cancelled,
        cancelledAt: null,
      }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] CANCELLED の cancelledAt が不正な Date の場合はエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({
        status: ResourceUnavailablePeriodStatus.Cancelled,
        cancelledAt: new Date("invalid-date"),
      }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] createdAt が不正な Date の場合はエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({
        createdAt: new Date("invalid-date"),
      }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[異常系] updatedAt が不正な Date の場合はエラー", () => {
    expect(() =>
      createTestResourceUnavailablePeriod({
        updatedAt: new Date("invalid-date"),
      }),
    ).toThrow(InvalidUnavailablePeriodError);
  });

  it("[正常系] 開始前の利用停止枠はキャンセルできる", () => {
    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod();

    const cancelled = resourceUnavailablePeriod.cancel(
      date("2026-06-10T12:00:00+09:00"),
    );

    expect(cancelled.status).toBe(ResourceUnavailablePeriodStatus.Cancelled);
    expect(cancelled.cancelledAt).toEqual(date("2026-06-10T12:00:00+09:00"));
  });

  it("[異常系] キャンセル済み利用停止枠は再度キャンセルできない", () => {
    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod({
      status: ResourceUnavailablePeriodStatus.Cancelled,
      cancelledAt: date("2026-06-10T12:00:00+09:00"),
    });

    expect(() =>
      resourceUnavailablePeriod.cancel(date("2026-06-10T13:00:00+09:00")),
    ).toThrow(ResourceUnavailablePeriodAlreadyCancelledError);
  });

  it("[異常系] 開始済み利用停止枠はキャンセルできない", () => {
    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod();

    expect(() =>
      resourceUnavailablePeriod.cancel(date("2026-06-11T10:00:00+09:00")),
    ).toThrow(CannotCancelStartedResourceUnavailablePeriodError);
  });

  it("[異常系] キャンセル日時が不正な Date の場合はエラー", () => {
    const resourceUnavailablePeriod = createTestResourceUnavailablePeriod();

    expect(() => resourceUnavailablePeriod.cancel(new Date("invalid-date"))).toThrow(
      InvalidUnavailablePeriodError,
    );
  });
});
