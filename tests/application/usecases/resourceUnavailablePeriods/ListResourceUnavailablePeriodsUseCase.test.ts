import { describe, expect, it } from "vitest";

import { ListResourceUnavailablePeriodsUseCase } from "@application/usecases/resourceUnavailablePeriods/ListResourceUnavailablePeriodsUseCase";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";
import { InMemoryResourceUnavailablePeriodRepository } from "@infrastructure/_repositories/InMemoryResourceUnavailablePeriodRepository";

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

const createUseCase = async () => {
  const repository = new InMemoryResourceUnavailablePeriodRepository();
  await repository.save(createResourceUnavailablePeriod());
  await repository.save(
    createResourceUnavailablePeriod({
      id: "rup_002",
      resourceType: ResourceType.Equipment,
      resourceId: "eq_001",
      status: ResourceUnavailablePeriodStatus.Cancelled,
      cancelledAt: date("2026-06-10T12:00:00+09:00"),
    }),
  );

  return new ListResourceUnavailablePeriodsUseCase(repository);
};

describe("ListResourceUnavailablePeriodsUseCase", () => {
  it("[正常系] 利用停止枠一覧を取得できる", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute();

    expect(output.items.map((item) => item.id)).toEqual(["rup_001", "rup_002"]);
  });

  it("[正常系] resourceType で絞り込める", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute({
      resourceType: ResourceType.MeetingRoom,
    });

    expect(output.items.map((item) => item.id)).toEqual(["rup_001"]);
  });

  it("[正常系] resourceId で絞り込める", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute({
      resourceId: "eq_001",
    });

    expect(output.items.map((item) => item.id)).toEqual(["rup_002"]);
  });

  it("[正常系] status で絞り込める", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute({
      status: ResourceUnavailablePeriodStatus.Cancelled,
    });

    expect(output.items.map((item) => item.id)).toEqual(["rup_002"]);
  });

  it("[正常系] from / to で絞り込める", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute({
      from: date("2026-06-11T09:00:00+09:00"),
      to: date("2026-06-11T12:00:00+09:00"),
    });

    expect(output.items.map((item) => item.id)).toEqual(["rup_001", "rup_002"]);
  });

  it("[正常系] from より前に開始する利用停止枠は除外される", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute({
      from: date("2026-06-11T10:30:00+09:00"),
    });

    expect(output.items).toHaveLength(0);
  });

  it("[正常系] to より後に終了する利用停止枠は除外される", async () => {
    const useCase = await createUseCase();

    const output = await useCase.execute({
      to: date("2026-06-11T10:30:00+09:00"),
    });

    expect(output.items).toHaveLength(0);
  });
});
