import { InvalidUnavailablePeriodError } from "@domain/errors/ResourceUnavailablePeriodErrors";

export class UnavailablePeriod {
  private constructor(
    private readonly startAtValue: Date,
    private readonly endAtValue: Date,
  ) {}

  public static create(startAt: Date, endAt: Date): UnavailablePeriod {
    if (!UnavailablePeriod.isValidDate(startAt)) {
      throw new InvalidUnavailablePeriodError("startAt must be a valid date.");
    }

    if (!UnavailablePeriod.isValidDate(endAt)) {
      throw new InvalidUnavailablePeriodError("endAt must be a valid date.");
    }

    if (startAt.getTime() >= endAt.getTime()) {
      throw new InvalidUnavailablePeriodError(
        "startAt must be earlier than endAt.",
      );
    }

    return new UnavailablePeriod(
      UnavailablePeriod.cloneDate(startAt),
      UnavailablePeriod.cloneDate(endAt),
    );
  }

  public get startAt(): Date {
    return UnavailablePeriod.cloneDate(this.startAtValue);
  }

  public get endAt(): Date {
    return UnavailablePeriod.cloneDate(this.endAtValue);
  }

  // 既存利用停止枠と新規利用停止枠(other)が重なっているかを見る
  public overlaps(other: UnavailablePeriod): boolean {
    // 片方の開始がもう片方の終了より前なら、時間帯が重なっています。
    return (
      this.startAtValue.getTime() < other.endAtValue.getTime() &&
      other.startAtValue.getTime() < this.endAtValue.getTime()
    );
  }

  public isStartedAtOrBefore(date: Date): boolean {
    if (!UnavailablePeriod.isValidDate(date)) {
      throw new InvalidUnavailablePeriodError("date must be a valid date.");
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
