import express, { type Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { type CancelReservationUseCase } from "@application/usecases/reservations/CancelReservationUseCase";
import { type CreateReservationUseCase } from "@application/usecases/reservations/CreateReservationUseCase";
import { type GetReservationUseCase } from "@application/usecases/reservations/GetReservationUseCase";
import { type ListReservationsUseCase } from "@application/usecases/reservations/ListReservationsUseCase";
import { PrismaEquipmentRepository } from "@infrastructure/prisma/repositories/PrismaEquipmentRepository";
import { PrismaMeetingRoomRepository } from "@infrastructure/prisma/repositories/PrismaMeetingRoomRepository";
import { PrismaReservationRepository } from "@infrastructure/prisma/repositories/PrismaReservationRepository";
import { PrismaResourceUnavailablePeriodRepository } from "@infrastructure/prisma/repositories/PrismaResourceUnavailablePeriodRepository";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";
import { createMeetingRoomRoutes } from "@infrastructure/web/routeFactories/meetingRoomRoutes";
import { createReservationRoutes } from "@infrastructure/web/routeFactories/reservationRoutes";
import { ReservationController } from "@interface/controllers/ReservationController";
import { PrismaClient } from "../../src/generated/prisma/client";
import { createPrismaTestDatabase } from "../infrastructure/prisma/prismaTestDatabase";

const createMeetingRoomRequestBody = {
  name: "会議室A",
  capacity: 6,
  location: "東京本社 3F",
  description: "モニターあり",
};

const createReservationRequestBody = {
  resourceType: "MEETING_ROOM",
  userId: "user_001",
  startAt: "2030-06-11T10:00:00+09:00",
  endAt: "2030-06-11T11:00:00+09:00",
  purpose: "定例ミーティング",
};

const createMeetingRoom = async (app: Express): Promise<string> => {
  const response = await request(app)
    .post("/meeting-rooms")
    .send(createMeetingRoomRequestBody)
    .expect(201);

  return response.body.id as string;
};

const createReservation = async (
  app: Express,
  overrides: Partial<typeof createReservationRequestBody> & {
    resourceId?: string;
  } = {},
): Promise<Record<string, unknown>> => {
  const resourceId = overrides.resourceId ?? (await createMeetingRoom(app));
  const response = await request(app)
    .post("/reservations")
    .send({
      ...createReservationRequestBody,
      resourceId,
      ...overrides,
    })
    .expect(201);

  return response.body as Record<string, unknown>;
};

describe("Reservation API", () => {
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

  describe("POST /reservations", () => {
    it("[正常系] request body が正しい場合、予約を作成して 201 を返す", async () => {
      const resourceId = await createMeetingRoom(app);

      const response = await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        resourceType: "MEETING_ROOM",
        resourceId,
        userId: "user_001",
        startAt: expect.any(String),
        endAt: expect.any(String),
        purpose: "定例ミーティング",
        status: "RESERVED",
        cancelledAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("[異常系] request body の必須項目が不足している場合、400 を返す", async () => {
      const response = await request(app)
        .post("/reservations")
        .send({
          resourceType: "MEETING_ROOM",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "resourceId",
          }),
        ]),
      );
    });

    it("[異常系] resourceType が許可された値でない場合、400 を返す", async () => {
      const response = await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceType: "INVALID_RESOURCE",
          resourceId: "resource_001",
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
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId: "resource_001",
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
      const resourceId = await createMeetingRoom(app);

      const response = await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId,
          startAt: "2030-06-11T11:00:00+09:00",
          endAt: "2030-06-11T10:00:00+09:00",
        })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: "INVALID_RESERVATION_PERIOD",
      });
    });

    it("[異常系] 指定したリソースが存在しない場合、404 を返す", async () => {
      const response = await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId: "missing_resource",
        })
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: "RESOURCE_NOT_FOUND",
      });
    });

    it("[異常系] 既存予約と時間帯が重複する場合、409 を返す", async () => {
      const resourceId = await createMeetingRoom(app);

      await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId,
        })
        .expect(201);

      const response = await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId,
          startAt: "2030-06-11T10:30:00+09:00",
          endAt: "2030-06-11T11:30:00+09:00",
        })
        .expect(409);

      expect(response.body.error).toMatchObject({
        code: "RESERVATION_CONFLICT",
      });
    });

    it("[異常系] 想定外のエラーが発生した場合、500 を返す", async () => {
      const app = express();
      const controller = new ReservationController(
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as CreateReservationUseCase,
        {
          execute: async () => ({ items: [] }),
        } as unknown as ListReservationsUseCase,
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as GetReservationUseCase,
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as CancelReservationUseCase,
      );

      app.use(express.json());
      app.post("/reservations", controller.create);

      const response = await request(app)
        .post("/reservations")
        .send({
          ...createReservationRequestBody,
          resourceId: "resource_001",
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

  describe("GET /reservations", () => {
    it("[正常系] query parameter が正しい場合、条件に一致する予約一覧を 200 で返す", async () => {
      const resourceId = await createMeetingRoom(app);

      await createReservation(app, {
        resourceId,
        userId: "user_001",
      });
      await createReservation(app, {
        resourceId,
        userId: "user_002",
        startAt: "2030-06-11T12:00:00+09:00",
        endAt: "2030-06-11T13:00:00+09:00",
      });

      const response = await request(app)
        .get("/reservations")
        .query({
          userId: "user_002",
          resourceType: "MEETING_ROOM",
          status: "RESERVED",
          from: "2030-06-11T00:00:00+09:00",
          to: "2030-06-12T00:00:00+09:00",
        })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          userId: "user_002",
          resourceType: "MEETING_ROOM",
          resourceId,
          status: "RESERVED",
        }),
      ]);
    });

    it("[異常系] resourceType が許可された値でない場合、400 を返す", async () => {
      const response = await request(app)
        .get("/reservations")
        .query({ resourceType: "INVALID_RESOURCE" })
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

    it("[異常系] status が許可された値でない場合、400 を返す", async () => {
      const response = await request(app)
        .get("/reservations")
        .query({ status: "INVALID_STATUS" })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "status",
          }),
        ]),
      );
    });

    it("[異常系] from が日時として不正な場合、400 を返す", async () => {
      const response = await request(app)
        .get("/reservations")
        .query({ from: "invalid-date" })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "from",
          }),
        ]),
      );
    });
  });

  describe("GET /reservations/:reservationId", () => {
    it("[正常系] 予約が存在する場合、予約詳細を 200 で返す", async () => {
      const reservation = await createReservation(app);

      const response = await request(app)
        .get(`/reservations/${String(reservation.id)}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: reservation.id,
        resourceType: "MEETING_ROOM",
        userId: "user_001",
        status: "RESERVED",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("[異常系] 予約が存在しない場合、404 を返す", async () => {
      const response = await request(app)
        .get("/reservations/missing_reservation")
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: "RESERVATION_NOT_FOUND",
      });
    });
  });

  describe("PATCH /reservations/:reservationId/cancel", () => {
    it("[正常系] request body が正しい場合、予約をキャンセルして 200 を返す", async () => {
      const reservation = await createReservation(app);

      const response = await request(app)
        .patch(`/reservations/${String(reservation.id)}/cancel`)
        .send({ userId: "user_001" })
        .expect(200);

      expect(response.body).toMatchObject({
        id: reservation.id,
        status: "CANCELLED",
        cancelledAt: expect.any(String),
      });
    });

    it("[異常系] request body の userId が不足している場合、400 を返す", async () => {
      const reservation = await createReservation(app);

      const response = await request(app)
        .patch(`/reservations/${String(reservation.id)}/cancel`)
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "userId",
          }),
        ]),
      );
    });

    it("[異常系] 予約が存在しない場合、404 を返す", async () => {
      const response = await request(app)
        .patch("/reservations/missing_reservation/cancel")
        .send({ userId: "user_001" })
        .expect(404);

      expect(response.body.error).toMatchObject({
        code: "RESERVATION_NOT_FOUND",
      });
    });

    it("[異常系] 予約者本人でない場合、403 を返す", async () => {
      const reservation = await createReservation(app);

      const response = await request(app)
        .patch(`/reservations/${String(reservation.id)}/cancel`)
        .send({ userId: "other_user" })
        .expect(403);

      expect(response.body.error).toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("[異常系] 予約がすでにキャンセル済みの場合、409 を返す", async () => {
      const reservation = await createReservation(app);

      await request(app)
        .patch(`/reservations/${String(reservation.id)}/cancel`)
        .send({ userId: "user_001" })
        .expect(200);

      const response = await request(app)
        .patch(`/reservations/${String(reservation.id)}/cancel`)
        .send({ userId: "user_001" })
        .expect(409);

      expect(response.body.error).toMatchObject({
        code: "ALREADY_CANCELLED",
      });
    });
  });
});
