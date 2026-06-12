import { randomUUID } from "node:crypto";

import { IdGenerator } from "@application/services/IdGenerator";

export class UuidGenerator implements IdGenerator {
  public generate(): string {
    return randomUUID();
  }
}

