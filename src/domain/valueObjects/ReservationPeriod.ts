import { InvalidReservationPeriodError } from "../errors/ReservationErrors";

export class ReservationPeriod {
  // constructor を private にして、必ず create の検証を通して生成します。
  // 例: const period = ReservationPeriod.create(startAt, endAt);
  private constructor(
    private readonly startAtValue: Date,
    private readonly endAtValue: Date,
  ) {}

  // create() の返り値は ReservationPeriod クラスのインスタンス
  public static create(startAt: Date, endAt: Date): ReservationPeriod {
    if (!ReservationPeriod.isValidDate(startAt)) {
      throw new InvalidReservationPeriodError("startAt must be a valid date.");
    }

    if (!ReservationPeriod.isValidDate(endAt)) {
      throw new InvalidReservationPeriodError("endAt must be a valid date.");
    }

    if (startAt.getTime() >= endAt.getTime()) {
      throw new InvalidReservationPeriodError(
        "startAt must be earlier than endAt.",
      );
    }

    // Date は mutable なので、受け取ったインスタンスをそのまま保持しません。
    // 渡されたDateが呼び出し元で変更された時、このクラスのインスタンスが影響を受けるのを防ぐため。
    return new ReservationPeriod(
      ReservationPeriod.cloneDate(startAt),
      ReservationPeriod.cloneDate(endAt),
    );
  }

  public get startAt(): Date {
    // 内部の Date を外から変更されないように clone して返します。
    return ReservationPeriod.cloneDate(this.startAtValue);
  }

  public get endAt(): Date {
    // startAt と同じ理由で、endAt も clone して返します。
    return ReservationPeriod.cloneDate(this.endAtValue);
  }

  // 既存予約と新規予約が重なっているかを見る
  // reservation と UnvaliablePeriod の period 重複の検証でも使うので、other の型を緩くしている
  // UnvaliablePeriod との検証がないなら other の型 はReservationPeriod で良い
  public overlaps(other: { startAt: Date; endAt: Date }): boolean {
    // 片方の開始がもう片方の終了より前なら、時間帯が重なっています。
    return (
      this.startAtValue.getTime() < other.endAt.getTime() &&
      other.startAt.getTime() < this.endAtValue.getTime()
    );
  }

  // 予約がすでに開始しているかを見る
  // 10~11時で予約していて、10時30分の時点で10~11時の予約を取り消すことを禁止する目的
  public isStartedAtOrBefore(date: Date): boolean {
    if (!ReservationPeriod.isValidDate(date)) {
      throw new InvalidReservationPeriodError("date must be a valid date.");
    }

    return this.startAtValue.getTime() <= date.getTime();
  }

  private static isValidDate(date: Date): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  private static cloneDate(date: Date): Date {
    return new Date(date.getTime());
  }
}
