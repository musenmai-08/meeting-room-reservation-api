import { Reservation } from "@domain/entities/Reservation";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { parseReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { parseResourceType } from "@domain/valueObjects/ResourceType";
import {
  type ReservationCreateInput,
  type ReservationModel,
} from "../../../generated/prisma/models/Reservation";

export class ReservationPrismaMapper {
  public static toDomain(record: ReservationModel): Reservation {
    return Reservation.create({
      id: record.id,
      resourceType: parseResourceType(record.resourceType),
      resourceId: record.resourceId,
      userId: record.userId,
      period: ReservationPeriod.create(record.startAt, record.endAt),
      purpose: record.purpose,
      status: parseReservationStatus(record.status),
      cancelledAt: record.cancelledAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  public static toPersistence(
    reservation: Reservation,
  ): ReservationCreateInput {
    return {
      id: reservation.id,
      resourceType: reservation.resourceType,
      resourceId: reservation.resourceId,
      userId: reservation.userId,
      startAt: reservation.period.startAt,
      endAt: reservation.period.endAt,
      purpose: reservation.purpose,
      status: reservation.status,
      cancelledAt: reservation.cancelledAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
