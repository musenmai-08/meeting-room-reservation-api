import { Reservation } from "@domain/entities/Reservation";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";

// 同一リソースの既存利用停止枠と、新しい利用停止期間が重複しているかを判定
export class ResourceUnavailablePeriodConflictService {
  public static hasConflictWithUnavailablePeriods(
    existingUnavailablePeriods: ResourceUnavailablePeriod[],
    newUnavailablePeriod: UnavailablePeriod,
  ): boolean {
    return existingUnavailablePeriods.some(
      (period) =>
        period.isActive() && period.period.overlaps(newUnavailablePeriod),
    );
  }

  // 新規利用停止枠が既存予約と重なっているかを見る
  public static hasConflictWithReservations(
    existingReservations: Reservation[],
    newUnavailablePeriod: UnavailablePeriod,
  ): boolean {
    return existingReservations.some(
      (reservation) =>
        reservation.isReserved() &&
        reservation.period.overlaps(newUnavailablePeriod),
    );
  }
}
