import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Reservation } from "@domain/entities/Reservation";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { PrismaReservationRepository } from "@infrastructure/prisma/repositories/PrismaReservationRepository";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { createPrismaTestDatabase } from "../prismaTestDatabase";

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

describe("PrismaReservationRepository", () => {
  let client: PrismaClient;
  let repository: PrismaReservationRepository;
  let cleanupDatabase: () => Promise<void>;

  beforeAll(async () => {
    const testDatabase = await createPrismaTestDatabase();
    client = testDatabase.client;
    cleanupDatabase = testDatabase.cleanup;
    repository = new PrismaReservationRepository(client);
  });

  beforeEach(async () => {
    await client.reservation.deleteMany();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("save / findById", () => {
    it("[正常系] save した Reservation を findById で取得できる", async () => {
      const reservation = createTestReservation();

      await repository.save(reservation);

      const foundReservation = await repository.findById("res_001");

      expect(foundReservation).not.toBeNull();
      expect(foundReservation?.id).toBe("res_001");
      expect(foundReservation?.resourceType).toBe(ResourceType.MeetingRoom);
      expect(foundReservation?.resourceId).toBe("mr_001");
      expect(foundReservation?.userId).toBe("user_001");
      expect(foundReservation?.period.startAt).toEqual(
        date("2026-06-11T10:00:00+09:00"),
      );
      expect(foundReservation?.period.endAt).toEqual(
        date("2026-06-11T11:00:00+09:00"),
      );
      expect(foundReservation?.purpose).toBe("定例ミーティング");
      expect(foundReservation?.status).toBe(ReservationStatus.Reserved);
      expect(foundReservation?.cancelledAt).toBeNull();
    });

    it("[正常系] 同じ id で save すると更新される", async () => {
      await repository.save(createTestReservation());
      await repository.save(
        createTestReservation({
          purpose: "更新後の会議",
          status: ReservationStatus.Cancelled,
          cancelledAt: date("2026-06-10T12:00:00+09:00"),
          updatedAt: date("2026-06-10T12:00:00+09:00"),
        }),
      );

      const foundReservation = await repository.findById("res_001");

      expect(foundReservation?.purpose).toBe("更新後の会議");
      expect(foundReservation?.status).toBe(ReservationStatus.Cancelled);
      expect(foundReservation?.cancelledAt).toEqual(
        date("2026-06-10T12:00:00+09:00"),
      );
      expect(foundReservation?.updatedAt).toEqual(
        date("2026-06-10T12:00:00+09:00"),
      );
    });

    it("[異常系] 存在しない id は null を返す", async () => {
      const foundReservation = await repository.findById("unknown");

      expect(foundReservation).toBeNull();
    });
  });

  describe("findAll", () => {
    it("[正常系] findAll で全件取得できる", async () => {
      await repository.save(
        createTestReservation({ id: "res_001", resourceId: "mr_001" }),
      );
      await repository.save(
        createTestReservation({ id: "res_002", resourceId: "mr_002" }),
      );

      const reservations = await repository.findAll();

      expect(reservations).toHaveLength(2);
      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_001",
        "res_002",
      ]);
    });

    it("[正常系] findAll で userId の条件検索ができる", async () => {
      await repository.save(
        createTestReservation({ id: "res_001", userId: "user_001" }),
      );
      await repository.save(
        createTestReservation({ id: "res_002", userId: "user_002" }),
      );

      const reservations = await repository.findAll({ userId: "user_002" });

      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_002",
      ]);
    });

    it("[正常系] findAll で resourceType / resourceId の条件検索ができる", async () => {
      await repository.save(
        createTestReservation({
          id: "res_001",
          resourceType: ResourceType.MeetingRoom,
          resourceId: "mr_001",
        }),
      );
      await repository.save(
        createTestReservation({
          id: "res_002",
          resourceType: ResourceType.Equipment,
          resourceId: "eq_001",
        }),
      );

      const reservations = await repository.findAll({
        resourceType: ResourceType.Equipment,
        resourceId: "eq_001",
      });

      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_002",
      ]);
    });

    it("[正常系] findAll で status の条件検索ができる", async () => {
      await repository.save(
        createTestReservation({
          id: "res_001",
          status: ReservationStatus.Reserved,
          cancelledAt: null,
        }),
      );
      await repository.save(
        createTestReservation({
          id: "res_002",
          status: ReservationStatus.Cancelled,
          cancelledAt: date("2026-06-10T12:00:00+09:00"),
        }),
      );

      const reservations = await repository.findAll({
        status: ReservationStatus.Cancelled,
      });

      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_002",
      ]);
    });

    it("[正常系] findAll で from / to の期間条件検索ができる", async () => {
      await repository.save(
        createTestReservation({
          id: "res_001",
          period: createPeriod(
            "2026-06-11T09:00:00+09:00",
            "2026-06-11T10:00:00+09:00",
          ),
        }),
      );
      await repository.save(
        createTestReservation({
          id: "res_002",
          period: createPeriod(
            "2026-06-11T11:00:00+09:00",
            "2026-06-11T12:00:00+09:00",
          ),
        }),
      );

      const reservations = await repository.findAll({
        from: date("2026-06-11T10:00:00+09:00"),
        to: date("2026-06-11T12:00:00+09:00"),
      });

      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_002",
      ]);
    });
  });

  describe("findByResource", () => {
    it("[正常系] findByResource で対象リソースの予約だけ取得できる", async () => {
      await repository.save(
        createTestReservation({ id: "res_001", resourceId: "mr_001" }),
      );
      await repository.save(
        createTestReservation({ id: "res_002", resourceId: "mr_002" }),
      );

      const reservations = await repository.findByResource({
        resourceType: ResourceType.MeetingRoom,
        resourceId: "mr_001",
      });

      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_001",
      ]);
    });
  });

  describe("findOverlappingByResourceType", () => {
    it("[正常系] findOverlappingByResourceType で重複する有効予約を取得できる", async () => {
      await repository.save(
        createTestReservation({
          id: "res_001",
          period: createPeriod(
            "2026-06-11T10:00:00+09:00",
            "2026-06-11T11:00:00+09:00",
          ),
        }),
      );
      await repository.save(
        createTestReservation({
          id: "res_002",
          period: createPeriod(
            "2026-06-11T12:00:00+09:00",
            "2026-06-11T13:00:00+09:00",
          ),
        }),
      );

      const reservations = await repository.findOverlappingByResourceType({
        resourceType: ResourceType.MeetingRoom,
        startAt: date("2026-06-11T10:30:00+09:00"),
        endAt: date("2026-06-11T11:30:00+09:00"),
      });

      expect(reservations.map((reservation) => reservation.id)).toEqual([
        "res_001",
      ]);
    });

    it("[正常系] findOverlappingByResourceType でキャンセル済み予約は除外される", async () => {
      await repository.save(
        createTestReservation({
          id: "res_001",
          status: ReservationStatus.Cancelled,
          cancelledAt: date("2026-06-10T12:00:00+09:00"),
        }),
      );

      const reservations = await repository.findOverlappingByResourceType({
        resourceType: ResourceType.MeetingRoom,
        startAt: date("2026-06-11T10:30:00+09:00"),
        endAt: date("2026-06-11T11:30:00+09:00"),
      });

      expect(reservations).toHaveLength(0);
    });
  });
});
