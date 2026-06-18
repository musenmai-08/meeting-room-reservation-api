import { describe, expect, it } from "vitest";

import { InvalidResourceUnavailablePeriodStatusError } from "@domain/errors/ResourceUnavailablePeriodErrors";
import {
  parseResourceUnavailablePeriodStatus,
  ResourceUnavailablePeriodStatus,
} from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

describe("ResourceUnavailablePeriodStatus", () => {
  it("[正常系] ACTIVE を parse できる", () => {
    expect(parseResourceUnavailablePeriodStatus("ACTIVE")).toBe(
      ResourceUnavailablePeriodStatus.Active,
    );
  });

  it("[正常系] CANCELLED を parse できる", () => {
    expect(parseResourceUnavailablePeriodStatus("CANCELLED")).toBe(
      ResourceUnavailablePeriodStatus.Cancelled,
    );
  });

  it("[異常系] 定義外の値はエラー", () => {
    expect(() => parseResourceUnavailablePeriodStatus("INVALID")).toThrow(
      InvalidResourceUnavailablePeriodStatusError,
    );
  });
});
