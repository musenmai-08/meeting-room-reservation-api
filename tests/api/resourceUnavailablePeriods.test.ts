import express, { type Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaEquipmentRepository } from "@infrastructure/prisma/repositories/PrismaEquipmentRepository";
import { PrismaMeetingRoomRepository } from "@infrastructure/prisma/repositories/PrismaMeetingRoomRepository";
import { PrismaReservationRepository } from "@infrastructure/prisma/repositories/PrismaReservationRepository";
import { PrismaResourceUnavailablePeriodRepository } from "@infrastructure/prisma/repositories/PrismaResourceUnavailablePeriodRepository";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";
import { createMeetingRoomRoutes } from "@infrastructure/web/routeFactories/meetingRoomRoutes";
import { createReservationRoutes } from "@infrastructure/web/routeFactories/reservationRoutes";
import { createResourceUnavailablePeriodRoutes } from "@infrastructure/web/routeFactories/resourceUnavailablePeriodRoutes";
import { ResourceUnavailablePeriodController } from "@interface/controllers/ResourceUnavailablePeriodController";
import { type CancelResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CancelResourceUnavailablePeriodUseCase";
import { type CreateResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CreateResourceUnavailablePeriodUseCase";
import { type GetResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/GetResourceUnavailablePeriodUseCase";
import { type ListResourceUnavailablePeriodsUseCase } from "@application/usecases/resourceUnavailablePeriods/ListResourceUnavailablePeriodsUseCase";
import { PrismaClient } from "../../src/generated/prisma/client";
import { createPrismaTestDatabase } from "../infrastructure/prisma/prismaTestDatabase";

const createMeetingRoom = async (app: Express): Promise<string> => {
  const response = await request(app)
    .post("/meeting-rooms")
    .send({
      name: "会議室A",
      capacity: 6,
      location: "東京本社 3F",
      description: "モニターあり",
    })
    .expect(201);

  return response.body.id as string;
};

const createResourceUnavailablePeriodRequestBody = {
  resourceType: "MEETING_ROOM",
  operatorId: "operator_001",
  startAt: "2030-06-11T10:00:00+09:00",
  endAt: "2030-06-11T11:00:00+09:00",
  reason: "メンテナンス",
};

const createResourceUnavailablePeriod = async (
  app: Express,
  overrides: Partial<typeof createResourceUnavailablePeriodRequestBody> & {
    resourceId?: string;
  } = {},
): Promise<Record<string, unknown>> => {
  const resourceId = overrides.resourceId ?? (await createMeetingRoom(app));
  const response = await request(app)
    .post("/resource-unavailable-periods")
    .send({
      ...createResourceUnavailablePeriodRequestBody,
      resourceId,
      ...overrides,
    })
    .expect(201);

  return response.body as Record<string, unknown>;
};

describe("ResourceUnavailablePeriod API", () => {
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
      createResourceUnavailablePeriodRoutes({
        resourceUnavailablePeriodRepository,
        reservationRepository,
        meetingRoomRepository,
        equipmentRepository,
        idGenerator,
        clock,
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

  describe("POST /resource-unavailable-periods", () => {
    it("[正常系] request body が正しい場合、利用停止枠を作成して 201 を返す", async () => {
      const resourceId = await createMeetingRoom(app);

      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          ...createResourceUnavailablePeriodRequestBody,
          resourceId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        resourceType: "MEETING_ROOM",
        resourceId,
        operatorId: "operator_001",
        startAt: expect.any(String),
        endAt: expect.any(String),
        reason: "メンテナンス",
        status: "ACTIVE",
        cancelledAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("[異常系] request body の必須項目が不足している場合、400 を返す", async () => {
      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          resourceType: "MEETING_ROOM",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("[異常系] 指定したリソースが存在しない場合、404 を返す", async () => {
      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          ...createResourceUnavailablePeriodRequestBody,
          resourceId: "mr_missing",
        })
        .expect(404);

      expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
    });

    it("[異常系] startAt が endAt より後の場合、400 を返す", async () => {
      const resourceId = await createMeetingRoom(app);

      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          ...createResourceUnavailablePeriodRequestBody,
          resourceId,
          startAt: "2030-06-11T11:00:00+09:00",
          endAt: "2030-06-11T10:00:00+09:00",
        })
        .expect(400);

      expect(response.body.error.code).toBe("INVALID_UNAVAILABLE_PERIOD");
    });

    it("[異常系] 既存利用停止枠と時間帯が重複する場合、409 を返す", async () => {
      const resourceId = await createMeetingRoom(app);
      await createResourceUnavailablePeriod(app, { resourceId });

      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          ...createResourceUnavailablePeriodRequestBody,
          resourceId,
          startAt: "2030-06-11T10:30:00+09:00",
          endAt: "2030-06-11T11:30:00+09:00",
        })
        .expect(409);

      expect(response.body.error.code).toBe(
        "RESOURCE_UNAVAILABLE_PERIOD_CONFLICT",
      );
    });

    it("[異常系] 既存予約と時間帯が重複する場合、409 を返す", async () => {
      const resourceId = await createMeetingRoom(app);
      await request(app)
        .post("/reservations")
        .send({
          resourceType: "MEETING_ROOM",
          resourceId,
          userId: "user_001",
          startAt: "2030-06-11T10:00:00+09:00",
          endAt: "2030-06-11T11:00:00+09:00",
          purpose: "定例ミーティング",
        })
        .expect(201);

      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          ...createResourceUnavailablePeriodRequestBody,
          resourceId,
          startAt: "2030-06-11T10:30:00+09:00",
          endAt: "2030-06-11T11:30:00+09:00",
        })
        .expect(409);

      expect(response.body.error.code).toBe("RESOURCE_HAS_ACTIVE_RESERVATION");
    });

    it("[異常系] 想定外のエラーが発生した場合、500 を返す", async () => {
      const app = express();
      const controller = new ResourceUnavailablePeriodController(
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as CreateResourceUnavailablePeriodUseCase,
        {
          execute: async () => ({ items: [] }),
        } as unknown as ListResourceUnavailablePeriodsUseCase,
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as GetResourceUnavailablePeriodUseCase,
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as CancelResourceUnavailablePeriodUseCase,
      );

      app.use(express.json());
      app.post("/resource-unavailable-periods", controller.create);

      const response = await request(app)
        .post("/resource-unavailable-periods")
        .send({
          ...createResourceUnavailablePeriodRequestBody,
          resourceId: "mr_001",
        })
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error.",
        },
      });
    });
  });

  describe("GET /resource-unavailable-periods", () => {
    it("[正常系] query parameter が正しい場合、条件に一致する利用停止枠一覧を 200 で返す", async () => {
      const created = await createResourceUnavailablePeriod(app);

      const response = await request(app)
        .get("/resource-unavailable-periods")
        .query({
          resourceType: "MEETING_ROOM",
          status: "ACTIVE",
        })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          id: created.id,
          resourceType: "MEETING_ROOM",
          status: "ACTIVE",
          reason: "メンテナンス",
        }),
      ]);
    });

    it("[異常系] status が許可された値でない場合、400 を返す", async () => {
      const response = await request(app)
        .get("/resource-unavailable-periods")
        .query({ status: "INVALID" })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /resource-unavailable-periods/:resourceUnavailablePeriodId", () => {
    it("[正常系] 利用停止枠が存在する場合、詳細を 200 で返す", async () => {
      const created = await createResourceUnavailablePeriod(app);

      const response = await request(app)
        .get(`/resource-unavailable-periods/${String(created.id)}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.id,
        reason: "メンテナンス",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("[異常系] 利用停止枠が存在しない場合、404 を返す", async () => {
      const response = await request(app)
        .get("/resource-unavailable-periods/rup_missing")
        .expect(404);

      expect(response.body.error.code).toBe(
        "RESOURCE_UNAVAILABLE_PERIOD_NOT_FOUND",
      );
    });
  });

  describe("PATCH /resource-unavailable-periods/:resourceUnavailablePeriodId/cancel", () => {
    it("[正常系] 利用停止枠をキャンセルして 200 を返す", async () => {
      const created = await createResourceUnavailablePeriod(app);

      const response = await request(app)
        .patch(`/resource-unavailable-periods/${String(created.id)}/cancel`)
        .send({ operatorId: "operator_001" })
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.id,
        status: "CANCELLED",
        cancelledAt: expect.any(String),
      });
    });

    it("[異常系] 利用停止枠が存在しない場合、404 を返す", async () => {
      const response = await request(app)
        .patch("/resource-unavailable-periods/rup_missing/cancel")
        .send({ operatorId: "operator_001" })
        .expect(404);

      expect(response.body.error.code).toBe(
        "RESOURCE_UNAVAILABLE_PERIOD_NOT_FOUND",
      );
    });

    it("[異常系] 利用停止枠がすでにキャンセル済みの場合、409 を返す", async () => {
      const created = await createResourceUnavailablePeriod(app);
      await request(app)
        .patch(`/resource-unavailable-periods/${String(created.id)}/cancel`)
        .send({ operatorId: "operator_001" })
        .expect(200);

      const response = await request(app)
        .patch(`/resource-unavailable-periods/${String(created.id)}/cancel`)
        .send({ operatorId: "operator_001" })
        .expect(409);

      expect(response.body.error.code).toBe(
        "RESOURCE_UNAVAILABLE_PERIOD_ALREADY_CANCELLED",
      );
    });
  });
});
