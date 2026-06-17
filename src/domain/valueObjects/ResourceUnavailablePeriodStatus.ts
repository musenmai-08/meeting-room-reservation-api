import { InvalidResourceUnavailablePeriodStatusError } from "@domain/errors/ResourceUnavailablePeriodErrors";

export const ResourceUnavailablePeriodStatus = {
  Active: "ACTIVE",
  Cancelled: "CANCELLED",
} as const;

export type ResourceUnavailablePeriodStatus =
  (typeof ResourceUnavailablePeriodStatus)[keyof typeof ResourceUnavailablePeriodStatus];

const resourceStatusValues: readonly string[] = Object.values(
  ResourceUnavailablePeriodStatus,
);

export function isResourceUnavailablePeriodStatus(
  value: string,
): value is ResourceUnavailablePeriodStatus {
  return resourceStatusValues.includes(value);
}

export function parseResourceUnavailablePeriodStatus(
  value: string,
): ResourceUnavailablePeriodStatus {
  if (!isResourceUnavailablePeriodStatus(value)) {
    throw new InvalidResourceUnavailablePeriodStatusError(value);
  }
  return value;
}
