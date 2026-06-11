import { describe, expect, it } from "vitest";

import { InvalidResourceTypeError } from "@domain/errors/ResourceErrors";
import {
  isResourceType,
  parseResourceType,
  ResourceType,
} from "@domain/valueObjects/ResourceType";

describe("ResourceType", () => {
  describe("parseResourceType", () => {
    it("[正常系] MEETING_ROOM を parse できる", () => {
      expect(parseResourceType("MEETING_ROOM")).toBe(ResourceType.MeetingRoom);
    });

    it("[正常系] EQUIPMENT を parse できる", () => {
      expect(parseResourceType("EQUIPMENT")).toBe(ResourceType.Equipment);
    });

    it("[異常系] 定義外の値はエラーになる", () => {
      expect(() => parseResourceType("UNKNOWN")).toThrow(
        InvalidResourceTypeError,
      );
    });
  });

  describe("isResourceType", () => {
    it("[正常系] 定義済みの値なら true を返す", () => {
      expect(isResourceType("MEETING_ROOM")).toBe(true);
      expect(isResourceType("EQUIPMENT")).toBe(true);
    });

    it("[正常系] 定義外の値なら false を返す", () => {
      expect(isResourceType("UNKNOWN")).toBe(false);
    });
  });
});
