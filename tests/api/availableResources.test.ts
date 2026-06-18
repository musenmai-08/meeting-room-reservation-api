import express, { type Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { type SearchAvailableResourcesUseCase } from "@application/usecases/resources/SearchAvailableResourcesUseCase";
import { PrismaEquipmentRepository } from "@infrastructure/prisma/repositories/PrismaEquipmentRepository";
import { PrismaMeetingRoomRepository } from "@infrastructure/prisma/repositories/PrismaMeetingRoomRepository";
import { PrismaReservationRepository } from "@infrastructure/prisma/repositories/PrismaReservationRepository";
import { PrismaResourceUnavailablePeriodRepository } from "@infrastructure/prisma/repositories/PrismaResourceUnavailablePeriodRepository";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";
import { createAvailableResourceRoutes } from "@infrastructure/web/routeFactories/availableResourceRoutes";
import { createEquipmentRoutes } from "@infrastructure/web/routeFactories/equipmentRoutes";
import { createMeetingRoomRoutes } from "@infrastructure/web/routeFactories/meetingRoomRoutes";
import { createReservationRoutes } from "@infrastructure/web/routeFactories/reservationRoutes";
import { AvailableResourceController } from "@interface/controllers/AvailableResourceController";
import { PrismaClient } from "../../src/generated/prisma/client";
import { createPrismaTestDatabase } from "../infrastructure/prisma/prismaTestDatabase";

const searchAvailableResourcesQuery = {
  resourceType: "MEETING_ROOM",
  startAt: "2030-06-11T10:00:00+09:00",
  endAt: "2030-06-11T11:00:00+09:00",
};

const createMeetingRoom = async (
  app: Express,
  overrides: {
    name?: string;
    capacity?: number;
    location?: string;
  } = {},
): Promise<string> => {
  const response = await request(app)
    .post("/meeting-rooms")
    .send({
      name: overrides.name ?? "会議室A",
      capacity: overrides.capacity ?? 6,
      location: overrides.location ?? "東京本社 3F",
      description: "モニターあり",
    })
    .expect(201);

  return response.body.id as string;
};

const createEquipment = async (
  app: Express,
  overrides: {
    name?: string;
    category?: string;
    location?: string;
  } = {},
): Promise<string> => {
  const response = await request(app)
    .post("/equipments")
    .send({
      name: overrides.name ?? "Projector_A",
      category: overrides.category ?? "PROJECTOR",
      location: overrides.location ?? "東京本社 3F",
      description: "貸し出し備品",
    })
    .expect(201);

  return response.body.id as string;
};

const createReservation = async (
  app: Express,
  input: {
    resourceType: string;
    resourceId: string;
    userId?: string;
    startAt?: string;
    endAt?: string;
  },
): Promise<string> => {
  const response = await request(app)
    .post("/reservations")
    .send({
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      userId: input.userId ?? "user_001",
      startAt: input.startAt ?? "2030-06-11T10:00:00+09:00",
      endAt: input.endAt ?? "2030-06-11T11:00:00+09:00",
      purpose: "定例ミーティング",
    })
    .expect(201);

  return response.body.id as string;
};

describe("AvailableResource API", () => {
  let app: Express;
  let client: PrismaClient;
  let cleanupDatabase: () => Promise<void>;

  beforeAll(async () => {
    const testDatabase = await createPrismaTestDatabase();
    client = testDatabase.client;
    cleanupDatabase = testDatabase.cleanup;

    const meetingRoomRepository = new PrismaMeetingRoomRepository(client);
    const equipmentRepository = new PrismaEquipmentRepository(client);
    const reservationRepository = new PrismaReservationRepository(client);
    const resourceUnavailablePeriodRepository =
      new PrismaResourceUnavailablePeriodRepository(client);
    const idGenerator = new UuidGenerator();
    const clock = new SystemClock();

    app = express();
    app.use(express.json());
    app.use(
      createMeetingRoomRoutes({
        meetingRoomRepository,
        idGenerator,
        clock,
      }),
    );
    app.use(
      createEquipmentRoutes({
        equipmentRepository,
        idGenerator,
        clock,
      }),
    );
    app.use(
      createReservationRoutes({
        reservationRepository,
        meetingRoomRepository,
        equipmentRepository,
        resourceUnavailablePeriodRepository,
        idGenerator,
        clock,
      }),
    );
    app.use(
      createAvailableResourceRoutes({
        meetingRoomRepository,
        equipmentRepository,
        reservationRepository,
        resourceUnavailablePeriodRepository,
      }),
    );
  });

  beforeEach(async () => {
    await client.resourceUnavailablePeriod.deleteMany();
    await client.reservation.deleteMany();
    await client.meetingRoom.deleteMany();
    await client.equipment.deleteMany();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("GET /available-resources", () => {
    it("[正常系] query parameter が正しい場合、予約可能な会議室一覧を 200 で返す", async () => {
      await createMeetingRoom(app, {
        name: "会議室A",
        capacity: 6,
      });

      const response = await request(app)
        .get("/available-resources")
        .query(searchAvailableResourcesQuery)
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          resourceType: "MEETING_ROOM",
          name: "会議室A",
          capacity: 6,
          location: "東京本社 3F",
        }),
      ]);
    });

    it("[正常系] capacityGte で会議室一覧を絞り込める", async () => {
      await createMeetingRoom(app, {
        name: "会議室A",
        capacity: 4,
      });
      await createMeetingRoom(app, {
        name: "会議室B",
        capacity: 8,
      });

      const response = await request(app)
        .get("/available-resources")
        .query({
          ...searchAvailableResourcesQuery,
          capacityGte: "5",
        })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          name: "会議室B",
          capacity: 8,
        }),
      ]);
    });

    it("[正常系] category で備品一覧を絞り込める", async () => {
      await createEquipment(app, {
        name: "Projector_A",
        category: "PROJECTOR",
      });
      await createEquipment(app, {
        name: "Monitor_A",
        category: "MONITOR",
      });

      const response = await request(app)
        .get("/available-resources")
        .query({
          resourceType: "EQUIPMENT",
          startAt: "2030-06-11T10:00:00+09:00",
          endAt: "2030-06-11T11:00:00+09:00",
          category: "MONITOR",
        })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          resourceType: "EQUIPMENT",
          name: "Monitor_A",
          category: "MONITOR",
        }),
      ]);
    });

    it("[異常系] resourceType が許可された値でない場合、400 を返す", async () => {
      const response = await request(app)
        .get("/available-resources")
        .query({
          ...searchAvailableResourcesQuery,
          resourceType: "INVALID_RESOURCE",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "resourceType",
          }),
        ]),
      );
    });

    it("[異常系] startAt が日時として不正な場合、400 を返す", async () => {
      const response = await request(app)
        .get("/available-resources")
        .query({
          ...searchAvailableResourcesQuery,
          startAt: "invalid-date",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "startAt",
          }),
        ]),
      );
    });

    it("[異常系] startAt が endAt より後の場合、400 を返す", async () => {
      const response = await request(app)
        .get("/available-resources")
        .query({
          ...searchAvailableResourcesQuery,
          startAt: "2030-06-11T11:00:00+09:00",
          endAt: "2030-06-11T10:00:00+09:00",
        })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: "INVALID_RESERVATION_PERIOD",
      });
    });

    it("[異常系] capacityGte が数値に変換できない場合、400 を返す", async () => {
      const response = await request(app)
        .get("/available-resources")
        .query({
          ...searchAvailableResourcesQuery,
          capacityGte: "abc",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "capacityGte",
          }),
        ]),
      );
    });

    it("[異常系] category が許可された値でない場合、400 を返す", async () => {
      const response = await request(app)
        .get("/available-resources")
        .query({
          resourceType: "EQUIPMENT",
          startAt: "2030-06-11T10:00:00+09:00",
          endAt: "2030-06-11T11:00:00+09:00",
          category: "INVALID_CATEGORY",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "category",
          }),
        ]),
      );
    });

    it("[正常系] 既存予約と重複するリソースは一覧に含まれない", async () => {
      const reservedMeetingRoomId = await createMeetingRoom(app, {
        name: "会議室A",
      });
      await createMeetingRoom(app, {
        name: "会議室B",
      });
      await createReservation(app, {
        resourceType: "MEETING_ROOM",
        resourceId: reservedMeetingRoomId,
      });

      const response = await request(app)
        .get("/available-resources")
        .query(searchAvailableResourcesQuery)
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          name: "会議室B",
        }),
      ]);
    });

    it("[正常系] キャンセル済み予約のみがあるリソースは一覧に含まれる", async () => {
      const meetingRoomId = await createMeetingRoom(app, {
        name: "会議室A",
      });
      const reservationId = await createReservation(app, {
        resourceType: "MEETING_ROOM",
        resourceId: meetingRoomId,
      });

      await request(app)
        .patch(`/reservations/${reservationId}/cancel`)
        .send({ userId: "user_001" })
        .expect(200);

      const response = await request(app)
        .get("/available-resources")
        .query(searchAvailableResourcesQuery)
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          id: meetingRoomId,
          name: "会議室A",
        }),
      ]);
    });

    it("[正常系] 有効な利用停止枠と重複するリソースは一覧に含まれない", async () => {
      const unavailableMeetingRoomId = await createMeetingRoom(app, {
        name: "会議室A",
      });
      await createMeetingRoom(app, {
        name: "会議室B",
      });
      await client.resourceUnavailablePeriod.create({
        data: {
          id: "rup_001",
          resourceType: "MEETING_ROOM",
          resourceId: unavailableMeetingRoomId,
          operatorId: "operator_001",
          startAt: new Date("2030-06-11T10:00:00+09:00"),
          endAt: new Date("2030-06-11T11:00:00+09:00"),
          reason: "メンテナンス",
          status: "ACTIVE",
          cancelledAt: null,
          createdAt: new Date("2030-06-10T10:00:00+09:00"),
          updatedAt: new Date("2030-06-10T10:00:00+09:00"),
        },
      });

      const response = await request(app)
        .get("/available-resources")
        .query(searchAvailableResourcesQuery)
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          name: "会議室B",
        }),
      ]);
    });

    it("[異常系] 想定外のエラーが発生した場合、500 を返す", async () => {
      const app = express();
      const controller = new AvailableResourceController({
        execute: async () => {
          throw new Error("Unexpected error for test.");
        },
      } as unknown as SearchAvailableResourcesUseCase);

      app.get("/available-resources", controller.search);

      const response = await request(app)
        .get("/available-resources")
        .query(searchAvailableResourcesQuery)
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error.",
        },
      });
    });
  });
});
