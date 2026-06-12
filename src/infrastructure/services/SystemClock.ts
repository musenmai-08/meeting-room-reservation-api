import { Clock } from "@application/services/Clock";

export class SystemClock implements Clock {
  public now(): Date {
    return new Date();
  }
}

