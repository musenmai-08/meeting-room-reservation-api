import { describe, expect, it } from "vitest";

import { InvalidEquipmentCategoryError } from "@domain/errors/EquipmentErrors";
import {
  EquipmentCategory,
  isEquipmentCategory,
  parseEquipmentCategory,
} from "@domain/valueObjects/EquipmentCategory";

describe("EquipmentCategory", () => {
  describe("parseEquipmentCategory", () => {
    it("[正常系] PROJECTOR を parse できる", () => {
      expect(parseEquipmentCategory("PROJECTOR")).toBe(
        EquipmentCategory.Projector,
      );
    });

    it("[正常系] MONITOR を parse できる", () => {
      expect(parseEquipmentCategory("MONITOR")).toBe(EquipmentCategory.Monitor);
    });

    it("[正常系] MICROPHONE を parse できる", () => {
      expect(parseEquipmentCategory("MICROPHONE")).toBe(
        EquipmentCategory.Microphone,
      );
    });

    it("[正常系] SPEAKER を parse できる", () => {
      expect(parseEquipmentCategory("SPEAKER")).toBe(EquipmentCategory.Speaker);
    });

    it("[正常系] WHITEBOARD を parse できる", () => {
      expect(parseEquipmentCategory("WHITEBOARD")).toBe(
        EquipmentCategory.Whiteboard,
      );
    });

    it("[正常系] OTHER を parse できる", () => {
      expect(parseEquipmentCategory("OTHER")).toBe(EquipmentCategory.Other);
    });

    it("[異常系] 定義外の値はエラーになる", () => {
      expect(() => parseEquipmentCategory("UNKNOWN")).toThrow(
        InvalidEquipmentCategoryError,
      );
    });
  });

  describe("isEquipmentCategory", () => {
    it("[正常系] 定義済みの値なら true を返す", () => {
      expect(isEquipmentCategory("PROJECTOR")).toBe(true);
      expect(isEquipmentCategory("MONITOR")).toBe(true);
      expect(isEquipmentCategory("MICROPHONE")).toBe(true);
      expect(isEquipmentCategory("SPEAKER")).toBe(true);
      expect(isEquipmentCategory("WHITEBOARD")).toBe(true);
      expect(isEquipmentCategory("OTHER")).toBe(true);
    });

    it("[正常系] 定義外の値なら false を返す", () => {
      expect(isEquipmentCategory("UNKNOWN")).toBe(false);
    });
  });
});
