import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Equipment } from "@domain/entities/Equipment";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { PrismaEquipmentRepository } from "@infrastructure/prisma/repositories/PrismaEquipmentRepository";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { createPrismaTestDatabase } from "../prismaTestDatabase";

type EquipmentFactoryProps = Parameters<typeof Equipment.create>[0];

const date = (isoString: string): Date => new Date(isoString);

const createTestEquipment = (
  overrides: Partial<EquipmentFactoryProps> = {},
): Equipment =>
  Equipment.create({
    id: "eq_001",
    name: "プロジェクターA",
    category: EquipmentCategory.Projector,
    location: "東京本社 3F",
    description: "HDMI 対応",
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("PrismaEquipmentRepository", () => {
  let client: PrismaClient;
  let repository: PrismaEquipmentRepository;
  let cleanupDatabase: () => Promise<void>;

  beforeAll(async () => {
    const testDatabase = await createPrismaTestDatabase();
    client = testDatabase.client;
    cleanupDatabase = testDatabase.cleanup;
    repository = new PrismaEquipmentRepository(client);
  });

  beforeEach(async () => {
    await client.equipment.deleteMany();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("save / findById", () => {
    it("[正常系] save した Equipment を findById で取得できる", async () => {
      const equipment = createTestEquipment();

      await repository.save(equipment);

      const foundEquipment = await repository.findById("eq_001");

      expect(foundEquipment).not.toBeNull();
      expect(foundEquipment?.id).toBe("eq_001");
      expect(foundEquipment?.name).toBe("プロジェクターA");
      expect(foundEquipment?.category).toBe(EquipmentCategory.Projector);
      expect(foundEquipment?.location).toBe("東京本社 3F");
      expect(foundEquipment?.description).toBe("HDMI 対応");
    });

    it("[正常系] 同じ id で save すると更新される", async () => {
      await repository.save(createTestEquipment());
      await repository.save(
        createTestEquipment({
          name: "モニターA",
          category: EquipmentCategory.Monitor,
          location: "東京本社 4F",
          description: "大型モニター",
          updatedAt: date("2026-06-11T10:00:00+09:00"),
        }),
      );

      const foundEquipment = await repository.findById("eq_001");

      expect(foundEquipment?.name).toBe("モニターA");
      expect(foundEquipment?.category).toBe(EquipmentCategory.Monitor);
      expect(foundEquipment?.location).toBe("東京本社 4F");
      expect(foundEquipment?.description).toBe("大型モニター");
      expect(foundEquipment?.updatedAt).toEqual(
        date("2026-06-11T10:00:00+09:00"),
      );
    });

    it("[異常系] 存在しない id は null を返す", async () => {
      const foundEquipment = await repository.findById("unknown");

      expect(foundEquipment).toBeNull();
    });
  });

  describe("findByName", () => {
    it("[正常系] save した Equipment を findByName で取得できる", async () => {
      await repository.save(createTestEquipment());

      const foundEquipment = await repository.findByName("プロジェクターA");

      expect(foundEquipment?.id).toBe("eq_001");
    });

    it("[異常系] 存在しない name は null を返す", async () => {
      const foundEquipment = await repository.findByName("存在しない備品");

      expect(foundEquipment).toBeNull();
    });
  });

  describe("findAll", () => {
    it("[正常系] findAll で全件取得できる", async () => {
      await repository.save(createTestEquipment({ id: "eq_001", name: "A" }));
      await repository.save(createTestEquipment({ id: "eq_002", name: "B" }));

      const equipments = await repository.findAll();

      expect(equipments).toHaveLength(2);
      expect(equipments.map((equipment) => equipment.id)).toEqual([
        "eq_001",
        "eq_002",
      ]);
    });

    it("[正常系] findAll で category の条件検索ができる", async () => {
      await repository.save(
        createTestEquipment({
          id: "eq_001",
          name: "プロジェクター",
          category: EquipmentCategory.Projector,
        }),
      );
      await repository.save(
        createTestEquipment({
          id: "eq_002",
          name: "マイク",
          category: EquipmentCategory.Microphone,
        }),
      );

      const equipments = await repository.findAll({
        category: EquipmentCategory.Microphone,
      });

      expect(equipments.map((equipment) => equipment.id)).toEqual(["eq_002"]);
    });

    it("[正常系] findAll で location の条件検索ができる", async () => {
      await repository.save(
        createTestEquipment({
          id: "eq_001",
          name: "東京プロジェクター",
          location: "東京本社",
        }),
      );
      await repository.save(
        createTestEquipment({
          id: "eq_002",
          name: "大阪プロジェクター",
          location: "大阪支社",
        }),
      );

      const equipments = await repository.findAll({ location: "東京本社" });

      expect(equipments.map((equipment) => equipment.id)).toEqual(["eq_001"]);
    });
  });
});
