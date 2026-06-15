import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { type CreateEquipmentUseCase } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { type ListEquipmentsUseCase } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { createServer } from "@infrastructure/web/server";
import { EquipmentController } from "@interface/controllers/EquipmentController";

const createEquipmentRequestBody = {
  name: "Projector_A",
  category: "PROJECTOR",
  location: "東京本社 3F",
  description: "貸し出し備品",
};

describe("Equipment API", () => {
  describe("POST /equipments", () => {
    it("[正常系] request body が正しい場合、備品を作成して 201 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/equipments")
        .send(createEquipmentRequestBody)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: "Projector_A",
        category: "PROJECTOR",
        location: "東京本社 3F",
        description: "貸し出し備品",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("[異常系] request body の必須項目が不足している場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/equipments")
        .send({
          category: "PROJECTOR",
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

    it("[異常系] category が許可された値でない場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
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

    it("[異常系] name が境界値未満の場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
          name: "",
        })
        .expect(400);

      expect(response.body.error).toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("[異常系] 同名の備品が存在する場合、409 を返す", async () => {
      const app = createServer();

      await request(app)
        .post("/equipments")
        .send(createEquipmentRequestBody)
        .expect(201);

      const response = await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
          location: "東京本社 4F",
        })
        .expect(409);

      expect(response.body.error).toMatchObject({
        code: "EQUIPMENT_ALREADY_EXISTS",
      });
    });

    it("[異常系] 想定外のエラーが発生した場合、500 を返す", async () => {
      const app = express();
      const controller = new EquipmentController(
        {
          execute: async () => {
            throw new Error("Unexpected error for test.");
          },
        } as unknown as CreateEquipmentUseCase,
        {
          execute: async () => ({ items: [] }),
        } as unknown as ListEquipmentsUseCase,
      );

      app.use(express.json());
      app.post("/equipments", controller.create);

      const response = await request(app)
        .post("/equipments")
        .send(createEquipmentRequestBody)
        .expect(500);

      expect(response.body).toEqual({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected error.",
        },
      });
    });
  });

  describe("GET /equipments", () => {
    it("[正常系] 備品一覧を 200 で取得できる", async () => {
      const app = createServer();

      await request(app)
        .post("/equipments")
        .send(createEquipmentRequestBody)
        .expect(201);

      const response = await request(app).get("/equipments").expect(200);

      expect(response.body).toEqual({
        items: [
          {
            id: expect.any(String),
            name: "Projector_A",
            category: "PROJECTOR",
            location: "東京本社 3F",
            description: "貸し出し備品",
          },
        ],
      });
    });

    it("[正常系] category で備品一覧を絞り込める", async () => {
      const app = createServer();

      await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
          name: "Projector_A",
          category: "PROJECTOR",
        })
        .expect(201);
      await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
          name: "Monitor_A",
          category: "MONITOR",
        })
        .expect(201);

      const response = await request(app)
        .get("/equipments")
        .query({ category: "MONITOR" })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          name: "Monitor_A",
          category: "MONITOR",
        }),
      ]);
    });

    it("[正常系] location で備品一覧を絞り込める", async () => {
      const app = createServer();

      await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
          name: "Projector_A",
          location: "東京本社 3F",
        })
        .expect(201);
      await request(app)
        .post("/equipments")
        .send({
          ...createEquipmentRequestBody,
          name: "Projector_B",
          location: "大阪支社 2F",
        })
        .expect(201);

      const response = await request(app)
        .get("/equipments")
        .query({ location: "大阪支社 2F" })
        .expect(200);

      expect(response.body.items).toEqual([
        expect.objectContaining({
          name: "Projector_B",
          location: "大阪支社 2F",
        }),
      ]);
    });

    it("[異常系] category が許可された値でない場合、400 を返す", async () => {
      const app = createServer();

      const response = await request(app)
        .get("/equipments")
        .query({ category: "INVALID_CATEGORY" })
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
  });
});
