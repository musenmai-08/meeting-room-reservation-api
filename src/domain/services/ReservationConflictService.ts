import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { Reservation } from "../entities/Reservation";
import { ReservationPeriod } from "../valueObjects/ReservationPeriod";

// 同一リソースの既存予約と、新しい予約期間が重複しているかを判定
export class ReservationConflictService {
  public static hasConflict(
    existingReservations: Reservation[],
    newPeriod: ReservationPeriod,
  ): boolean {
    // status が reserved かつ 期間が重複している場合に true を返す
    return existingReservations.some(
      (reservation) =>
        reservation.isReserved() && reservation.period.overlaps(newPeriod),
    );
  }

  public static hasConflictWithUnavailablePeriods(
    unavailablePeriods: ResourceUnavailablePeriod[],
    newPeriod: ReservationPeriod,
  ): boolean {
    return unavailablePeriods.some(
      (period) => period.isActive() && period.period.overlaps(newPeriod),
    );
  }
}
