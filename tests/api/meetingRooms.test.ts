import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { type CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { type ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { createServer } from "@infrastructure/web/server";
import { MeetingRoomController } from "@interface/controllers/MeetingRoomController";

const createMeetingRoomRequestBody = {
  name: "会議室A",
  capacity: 6,
  location: "東京本社 3F",
  description: "モニターあり",
};

describe("MeetingRoom API", () => {
  describe("POST /meeting-rooms", () => {
    it("[正常系] request body が正しい場合、会議室を作成して 201 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/meeting-rooms")
        .send(createMeetingRoomRequestBody)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: "会議室A",
        capacity: 6,
        location: "東京本社 3F",
        description: "モニターあり",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("[異常系] request body の必須項目が不足している場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/meeting-rooms")
        .send({
          capacity: 6,
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "name",
          }),
        ]),
      );
    });

    it("[異常系] request body の型が不正な場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/meeting-rooms")
        .send({
          ...createMeetingRoomRequestBody,
          capacity: "6",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "capacity",
          }),
        ]),
      );
    });

    it("[異常系] capacity が境界値未満の場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/meeting-rooms")
        .send({
          ...createMeetingRoomRequestBody,
          capacity: 0,
        })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("[異常系] 同名の会議室が存在する場合、409 を返す", async () => {
      const app = createServer();

      await request(app)
        .post("/meeting-rooms")
        .send(createMeetingRoomRequestBody)
        .expect(201);

      const response = await request(app)
        .post("/meeting-rooms")
        .send({
          ...createMeetingRoomRequestBody,
          location: "東京本社 4F",
        })
        .expect(409);

      expect(response.body.error).toMatchObject({
        code: "MEETING_ROOM_ALREADY_EXISTS",
      });
    });

    it("[異常系] 想定外のエラーが発生した場合、500 を返す", async () => {
      const app = express();
      const controller = new MeetingRoomController(
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as CreateMeetingRoomUseCase,
        {
          execute: async () => ({ items: [] }),
        } as unknown as ListMeetingRoomsUseCase,
      );

      app.use(express.json());
      app.post("/meeting-rooms", controller.create);

      const response = await request(app)
        .post("/meeting-rooms")
        .send(createMeetingRoomRequestBody)
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error.",
        },
      });
    });
  });

  describe("GET /meeting-rooms", () => {
    it("[正常系] 会議室一覧を 200 で取得できる", async () => {
      const app = createServer();

      await request(app)
        .post("/meeting-rooms")
        .send(createMeetingRoomRequestBody)
        .expect(201);

      const response = await request(app).get("/meeting-rooms").expect(200);

      expect(response.body).toEqual({
        items: [
          {
            id: expect.any(String),
            name: "会議室A",
            capacity: 6,
            location: "東京本社 3F",
            description: "モニターあり",
          },
        ],
      });
    });

    it("[正常系] capacityGte で会議室一覧を絞り込める", async () => {
      const app = createServer();

      await request(app)
        .post("/meeting-rooms")
        .send({
          ...createMeetingRoomRequestBody,
          name: "会議室A",
          capacity: 4,
        })
        .expect(201);
      await request(app)
        .post("/meeting-rooms")
        .send({
          ...createMeetingRoomRequestBody,
          name: "会議室B",
          capacity: 8,
        })
        .expect(201);

      const response = await request(app)
        .get("/meeting-rooms")
        .query({ capacityGte: "5" })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          name: "会議室B",
          capacity: 8,
        }),
      ]);
    });

    it("[異常系] capacityGte が数値に変換できない場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .get("/meeting-rooms")
        .query({ capacityGte: "abc" })
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

    it("[異常系] capacityGte が空文字の場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .get("/meeting-rooms")
        .query({ capacityGte: "" })
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
  });
});
