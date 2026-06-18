import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";
import { PrismaResourceUnavailablePeriodRepository } from "@infrastructure/prisma/repositories/PrismaResourceUnavailablePeriodRepository";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { createPrismaTestDatabase } from "../prismaTestDatabase";

type ResourceUnavailablePeriodFactoryProps = Parameters<
  typeof ResourceUnavailablePeriod.create
>[0];

const date = (isoString: string): Date => new Date(isoString);

const createPeriod = (startAt: string, endAt: string): UnavailablePeriod =>
  UnavailablePeriod.create(date(startAt), date(endAt));

const createTestResourceUnavailablePeriod = (
  overrides: Partial<ResourceUnavailablePeriodFactoryProps> = {},
): ResourceUnavailablePeriod =>
  ResourceUnavailablePeriod.create({
    id: "rup_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    operatorId: "operator_001",
    period: createPeriod(
      "2026-06-11T10:00:00+09:00",
      "2026-06-11T11:00:00+09:00",
    ),
    reason: "メンテナンス",
    status: ResourceUnavailablePeriodStatus.Active,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("PrismaResourceUnavailablePeriodRepository", () => {
  let client: PrismaClient;
  let repository: PrismaResourceUnavailablePeriodRepository;
  let cleanupDatabase: () => Promise<void>;

  beforeAll(async () => {
    const testDatabase = await createPrismaTestDatabase();
    client = testDatabase.client;
    cleanupDatabase = testDatabase.cleanup;
    repository = new PrismaResourceUnavailablePeriodRepository(client);
  });

  beforeEach(async () => {
    await client.resourceUnavailablePeriod.deleteMany();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("save / findById", () => {
    it("[正常系] save した ResourceUnavailablePeriod を findById で取得できる", async () => {
      await repository.save(createTestResourceUnavailablePeriod());

      const found = await repository.findById("rup_001");

      expect(found).not.toBeNull();
      expect(found?.id).toBe("rup_001");
      expect(found?.resourceType).toBe(ResourceType.MeetingRoom);
      expect(found?.resourceId).toBe("mr_001");
      expect(found?.operatorId).toBe("operator_001");
      expect(found?.reason).toBe("メンテナンス");
      expect(found?.status).toBe(ResourceUnavailablePeriodStatus.Active);
      expect(found?.cancelledAt).toBeNull();
    });

    it("[正常系] 同じ id で save すると更新される", async () => {
      await repository.save(createTestResourceUnavailablePeriod());
      await repository.save(
        createTestResourceUnavailablePeriod({
          reason: "更新後メンテナンス",
          status: ResourceUnavailablePeriodStatus.Cancelled,
          cancelledAt: date("2026-06-10T12:00:00+09:00"),
          updatedAt: date("2026-06-10T12:00:00+09:00"),
        }),
      );

      const found = await repository.findById("rup_001");

      expect(found?.reason).toBe("更新後メンテナンス");
      expect(found?.status).toBe(ResourceUnavailablePeriodStatus.Cancelled);
      expect(found?.cancelledAt).toEqual(date("2026-06-10T12:00:00+09:00"));
    });

    it("[異常系] 存在しない id は null を返す", async () => {
      await expect(repository.findById("missing")).resolves.toBeNull();
    });
  });

  describe("findAll", () => {
    it("[正常系] findAll で全件取得できる", async () => {
      await repository.save(createTestResourceUnavailablePeriod({ id: "rup_001" }));
      await repository.save(
        createTestResourceUnavailablePeriod({
          id: "rup_002",
          resourceId: "mr_002",
        }),
      );

      const results = await repository.findAll();

      expect(results.map((result) => result.id)).toEqual(["rup_001", "rup_002"]);
    });

    it("[正常系] findAll で resourceType / resourceId の条件検索ができる", async () => {
      await repository.save(createTestResourceUnavailablePeriod({ id: "rup_001" }));
      await repository.save(
        createTestResourceUnavailablePeriod({
          id: "rup_002",
          resourceType: ResourceType.Equipment,
          resourceId: "eq_001",
        }),
      );

      const results = await repository.findAll({
        resourceType: ResourceType.Equipment,
        resourceId: "eq_001",
      });

      expect(results.map((result) => result.id)).toEqual(["rup_002"]);
    });

    it("[正常系] findAll で status の条件検索ができる", async () => {
      await repository.save(createTestResourceUnavailablePeriod({ id: "rup_001" }));
      await repository.save(
        createTestResourceUnavailablePeriod({
          id: "rup_002",
          status: ResourceUnavailablePeriodStatus.Cancelled,
          cancelledAt: date("2026-06-10T12:00:00+09:00"),
        }),
      );

      const results = await repository.findAll({
        status: ResourceUnavailablePeriodStatus.Cancelled,
      });

      expect(results.map((result) => result.id)).toEqual(["rup_002"]);
    });

    it("[正常系] findAll で from / to の期間条件検索ができる", async () => {
      await repository.save(
        createTestResourceUnavailablePeriod({
          id: "rup_001",
          period: createPeriod(
            "2026-06-11T09:00:00+09:00",
            "2026-06-11T10:00:00+09:00",
          ),
        }),
      );
      await repository.save(
        createTestResourceUnavailablePeriod({
          id: "rup_002",
          period: createPeriod(
            "2026-06-11T11:00:00+09:00",
            "2026-06-11T12:00:00+09:00",
          ),
        }),
      );

      const results = await repository.findAll({
        from: date("2026-06-11T10:00:00+09:00"),
        to: date("2026-06-11T12:00:00+09:00"),
      });

      expect(results.map((result) => result.id)).toEqual(["rup_002"]);
    });
  });

  describe("findByResource", () => {
    it("[正常系] findByResource で対象リソースの利用停止枠だけ取得できる", async () => {
      await repository.save(createTestResourceUnavailablePeriod({ id: "rup_001" }));
      await repository.save(
        createTestResourceUnavailablePeriod({
          id: "rup_002",
          resourceId: "mr_002",
        }),
      );

      const results = await repository.findByResource({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
      });

      expect(results.map((result) => result.id)).toEqual(["rup_001"]);
    });
  });
});
