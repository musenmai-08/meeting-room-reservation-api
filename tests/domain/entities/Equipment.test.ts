import { describe, expect, it } from "vitest";

import { Equipment } from "@domain/entities/Equipment";
import { InvalidEquipmentError } from "@domain/errors/EquipmentErrors";
import {
  EquipmentCategory,
  type EquipmentCategory as EquipmentCategoryType,
} from "@domain/valueObjects/EquipmentCategory";

type EquipmentFactoryProps = Parameters<typeof Equipment.create>[0];

const date = (isoString: string): Date => new Date(isoString);

const createTestEquipment = (
  overrides: Partial<EquipmentFactoryProps> = {},
): Equipment =>
  Equipment.create({
    id: "eq_001",
    name: "プロジェクターA",
    category: EquipmentCategory.Projector,
    location: "東京本社 2F",
    description: "HDMI対応",
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("Equipment", () => {
  describe("create", () => {
    it("[正常系] 有効な値の場合、Equipment を生成できる", () => {
      const equipment = createTestEquipment();

      expect(equipment.id).toBe("eq_001");
      expect(equipment.name).toBe("プロジェクターA");
      expect(equipment.category).toBe(EquipmentCategory.Projector);
      expect(equipment.location).toBe("東京本社 2F");
      expect(equipment.description).toBe("HDMI対応");
    });

    it("[正常系] name が 1 文字の場合、Equipment を生成できる", () => {
      const equipment = createTestEquipment({ name: "A" });

      expect(equipment.name).toBe("A");
    });

    it("[正常系] name が 100 文字の場合、Equipment を生成できる", () => {
      const name = "A".repeat(100);

      const equipment = createTestEquipment({ name });

      expect(equipment.name).toBe(name);
    });

    it("[正常系] 定義済みカテゴリの場合、Equipment を生成できる", () => {
      const equipment = createTestEquipment({
        category: EquipmentCategory.Monitor,
      });

      expect(equipment.category).toBe(EquipmentCategory.Monitor);
    });

    it("[正常系] name の前後に空白がある場合、trim して保持する", () => {
      const equipment = createTestEquipment({ name: "  モニターA  " });

      expect(equipment.name).toBe("モニターA");
    });

    it("[正常系] Date の getter は clone を返す", () => {
      const equipment = createTestEquipment();

      const createdAt = equipment.createdAt;
      const updatedAt = equipment.updatedAt;
      createdAt.setHours(20);
      updatedAt.setHours(20);

      expect(equipment.createdAt).toEqual(date("2026-06-10T10:00:00+09:00"));
      expect(equipment.updatedAt).toEqual(date("2026-06-10T10:00:00+09:00"));
    });

    it("[異常系] id が空の場合、エラーになる", () => {
      expect(() => createTestEquipment({ id: " " })).toThrow(
        InvalidEquipmentError,
      );
    });

    it("[異常系] name が空の場合、エラーになる", () => {
      expect(() => createTestEquipment({ name: " " })).toThrow(
        InvalidEquipmentError,
      );
    });

    it("[異常系] name が 101 文字の場合、エラーになる", () => {
      expect(() => createTestEquipment({ name: "A".repeat(101) })).toThrow(
        InvalidEquipmentError,
      );
    });

    it("[異常系] 定義外カテゴリの場合、エラーになる", () => {
      expect(() =>
        createTestEquipment({
          category: "UNKNOWN" as unknown as EquipmentCategoryType,
        }),
      ).toThrow(InvalidEquipmentError);
    });

    it("[異常系] createdAt が不正な Date の場合、エラーになる", () => {
      expect(() => createTestEquipment({ createdAt: date("invalid") })).toThrow(
        InvalidEquipmentError,
      );
    });

    it("[異常系] updatedAt が不正な Date の場合、エラーになる", () => {
      expect(() => createTestEquipment({ updatedAt: date("invalid") })).toThrow(
        InvalidEquipmentError,
      );
    });
  });

  describe("equals", () => {
    it("[正常系] id が同じ場合、同じ Entity として扱う", () => {
      const equipment = createTestEquipment({ id: "eq_001" });
      const otherEquipment = createTestEquipment({
        id: "eq_001",
        name: "別の備品",
      });

      expect(equipment.equals(otherEquipment)).toBe(true);
    });

    it("[正常系] id が異なる場合、別の Entity として扱う", () => {
      const equipment = createTestEquipment({ id: "eq_001" });
      const otherEquipment = createTestEquipment({ id: "eq_002" });

      expect(equipment.equals(otherEquipment)).toBe(false);
    });
  });
});
