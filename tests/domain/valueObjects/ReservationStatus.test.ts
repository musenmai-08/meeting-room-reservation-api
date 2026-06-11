import { describe, expect, it } from "vitest";

import { InvalidReservationStatusError } from "@domain/errors/ReservationErrors";
import {
  isReservationStatus,
  parseReservationStatus,
  ReservationStatus,
} from "@domain/valueObjects/ReservationStatus";

describe("ReservationStatus", () => {
  describe("parseReservationStatus", () => {
    it("[正常系] RESERVED を parse できる", () => {
      expect(parseReservationStatus("RESERVED")).toBe(
        ReservationStatus.Reserved,
      );
    });

    it("[正常系] CANCELLED を parse できる", () => {
      expect(parseReservationStatus("CANCELLED")).toBe(
        ReservationStatus.Cancelled,
      );
    });

    it("[異常系] 定義外の値はエラーになる", () => {
      expect(() => parseReservationStatus("UNKNOWN")).toThrow(
        InvalidReservationStatusError,
      );
    });
  });

  describe("isReservationStatus", () => {
    it("[正常系] 定義済みの値なら true を返す", () => {
      expect(isReservationStatus("RESERVED")).toBe(true);
      expect(isReservationStatus("CANCELLED")).toBe(true);
    });

    it("[正常系] 定義外の値なら false を返す", () => {
      expect(isReservationStatus("UNKNOWN")).toBe(false);
    });
  });
});
