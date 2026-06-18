import { describe, expect, it } from "vitest";

import { ResourceUnavailablePeriodNotFoundError } from "@application/errors/ResourceUnavailablePeriodError";
import { type Clock } from "@application/services/Clock";
import { CancelResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CancelResourceUnavailablePeriodUseCase";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import {
  CannotCancelStartedResourceUnavailablePeriodError,
  ResourceUnavailablePeriodAlreadyCancelledError,
} from "@domain/errors/ResourceUnavailablePeriodErrors";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";
import { InMemoryResourceUnavailablePeriodRepository } from "@infrastructure/_repositories/InMemoryResourceUnavailablePeriodRepository";

class FixedClock implements Clock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

const date = (isoString: string): Date => new Date(isoString);

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

const createUseCase = (now = date("2026-06-10T12:00:00+09:00")) => {
  const resourceUnavailablePeriodRepository =
    new InMemoryResourceUnavailablePeriodRepository();
  const useCase = new CancelResourceUnavailablePeriodUseCase(
    resourceUnavailablePeriodRepository,
    new FixedClock(now),
  );

  return { useCase, resourceUnavailablePeriodRepository };
};

describe("CancelResourceUnavailablePeriodUseCase", () => {
  it("[正常系] 存在する利用停止枠をキャンセルできる", async () => {
    const { useCase, resourceUnavailablePeriodRepository } = createUseCase();
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod(),
    );

    const output = await useCase.execute({ id: "rup_001" });

    expect(output.status).toBe(ResourceUnavailablePeriodStatus.Cancelled);
    expect(output.cancelledAt).toEqual(date("2026-06-10T12:00:00+09:00"));
    expect(
      (await resourceUnavailablePeriodRepository.findById("rup_001"))?.status,
    ).toBe(ResourceUnavailablePeriodStatus.Cancelled);
  });

  it("[異常系] 存在しない利用停止枠はキャンセルできない", async () => {
    const { useCase } = createUseCase();

    await expect(useCase.execute({ id: "rup_missing" })).rejects.toThrow(
      ResourceUnavailablePeriodNotFoundError,
    );
  });

  it("[異常系] キャンセル済み利用停止枠は再度キャンセルできない", async () => {
    const { useCase, resourceUnavailablePeriodRepository } = createUseCase();
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod({
        status: ResourceUnavailablePeriodStatus.Cancelled,
        cancelledAt: date("2026-06-10T11:00:00+09:00"),
      }),
    );

    await expect(useCase.execute({ id: "rup_001" })).rejects.toThrow(
      ResourceUnavailablePeriodAlreadyCancelledError,
    );
  });

  it("[異常系] 開始済み利用停止枠はキャンセルできない", async () => {
    const { useCase, resourceUnavailablePeriodRepository } = createUseCase(
      date("2026-06-11T10:00:00+09:00"),
    );
    await resourceUnavailablePeriodRepository.save(
      createResourceUnavailablePeriod(),
    );

    await expect(useCase.execute({ id: "rup_001" })).rejects.toThrow(
      CannotCancelStartedResourceUnavailablePeriodError,
    );
  });
});
