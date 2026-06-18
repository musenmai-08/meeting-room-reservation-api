import { describe, expect, it } from "vitest";

import { ResourceUnavailablePeriodNotFoundError } from "@application/errors/ResourceUnavailablePeriodError";
import { GetResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/GetResourceUnavailablePeriodUseCase";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";
import { InMemoryResourceUnavailablePeriodRepository } from "@infrastructure/_repositories/InMemoryResourceUnavailablePeriodRepository";

const date = (isoString: string): Date => new Date(isoString);

const createResourceUnavailablePeriod = (): ResourceUnavailablePeriod =>
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
  });

describe("GetResourceUnavailablePeriodUseCase", () => {
  it("[正常系] 存在する利用停止枠の詳細を取得できる", async () => {
    const repository = new InMemoryResourceUnavailablePeriodRepository();
    await repository.save(createResourceUnavailablePeriod());
    const useCase = new GetResourceUnavailablePeriodUseCase(repository);

    const output = await useCase.execute({ id: "rup_001" });

    expect(output).toMatchObject({
      id: "rup_001",
      resourceType: ResourceType.MeetingRoom,
      resourceId: "mr_001",
      operatorId: "operator_001",
      reason: "メンテナンス",
      status: ResourceUnavailablePeriodStatus.Active,
    });
  });

  it("[異常系] 存在しない利用停止枠は取得できない", async () => {
    const repository = new InMemoryResourceUnavailablePeriodRepository();
    const useCase = new GetResourceUnavailablePeriodUseCase(repository);

    await expect(useCase.execute({ id: "rup_missing" })).rejects.toThrow(
      ResourceUnavailablePeriodNotFoundError,
    );
  });
});
