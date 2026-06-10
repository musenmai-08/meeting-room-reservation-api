export const ReservationStatus = {
  Reserved: "RESERVED",
  Cancelled: "CANCELLED",
} as const;

export type ReservationStatus =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];

export class InvalidReservationStatusError extends Error {
  public constructor(value: string) {
    super(`Invalid reservation status: ${value}`);
    this.name = "InvalidReservationStatusError";
  }
}

const reservationStatusValues: readonly string[] =
  Object.values(ReservationStatus);

export function isReservationStatus(value: string): value is ReservationStatus {
  return reservationStatusValues.includes(value);
}

export function parseReservationStatus(value: string): ReservationStatus {
  if (!isReservationStatus(value)) {
    throw new InvalidReservationStatusError(value);
  }

  return value;
}

