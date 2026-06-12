import { describe, expect, it } from "vitest";

import { EquipmentAlreadyExistsError } from "@application/errors/EquipmentApplicationErrors";
import { type Clock } from "@application/services/Clock";
import { type IdGenerator } from "@application/services/IdGenerator";
import { CreateEquipmentUseCase } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { InMemoryEquipmentRepository } from "@infrastructure/repositories/InMemoryEquipmentRepository";

class FixedIdGenerator implements IdGenerator {
  public constructor(private readonly id: string) {}

  public generate(): string {
    return this.id;
  }
}

class FixedClock implements Clock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

const date = (isoString: string): Date => new Date(isoString);

const createUseCase = (
  options: {
    id?: string;
    now?: Date;
    repository?: InMemoryEquipmentRepository;
  } = {},
): {
  useCase: CreateEquipmentUseCase;
  repository: InMemoryEquipmentRepository;
} => {
  const repository = options.repository ?? new InMemoryEquipmentRepository();
  const useCase = new CreateEquipmentUseCase(
    repository,
    new FixedIdGenerator(options.id ?? "eq_001"),
    new FixedClock(options.now ?? date("2026-06-10T10:00:00+09:00")),
  );

  return { useCase, repository };
};

describe("CreateEquipmentUseCase", () => {
  it("[正常系] 同名の備品が存在しない場合、備品を作成できる", async () => {
    const { useCase } = createUseCase();

    const output = await useCase.execute({
      name: "プロジェクターA",
      category: EquipmentCategory.Projector,
      location: "東京本社 2F",
      description: "HDMI対応",
    });

    expect(output).toEqual({
      id: "eq_001",
      name: "プロジェクターA",
      category: EquipmentCategory.Projector,
      location: "東京本社 2F",
      description: "HDMI対応",
      createdAt: date("2026-06-10T10:00:00+09:00"),
      updatedAt: date("2026-06-10T10:00:00+09:00"),
    });
  });

  it("[異常系] 同名の備品が存在する場合、作成に失敗する", async () => {
    const repository = new InMemoryEquipmentRepository();
    const { useCase: firstUseCase } = createUseCase({
      id: "eq_001",
      repository,
    });
    const { useCase: secondUseCase } = createUseCase({
      id: "eq_002",
      repository,
    });
    await firstUseCase.execute({
      name: "プロジェクターA",
      category: EquipmentCategory.Projector,
    });

    await expect(
      secondUseCase.execute({
        name: "プロジェクターA",
        category: EquipmentCategory.Monitor,
      }),
    ).rejects.toThrow(EquipmentAlreadyExistsError);
  });

  it("[正常系] 作成時に IdGenerator の ID を使う", async () => {
    const { useCase } = createUseCase({ id: "eq_custom" });

    const output = await useCase.execute({
      name: "プロジェクターA",
      category: EquipmentCategory.Projector,
    });

    expect(output.id).toBe("eq_custom");
  });

  it("[正常系] 作成時に Clock の現在日時を createdAt と updatedAt に使う", async () => {
    const now = date("2026-06-10T12:34:56+09:00");
    const { useCase } = createUseCase({ now });

    const output = await useCase.execute({
      name: "プロジェクターA",
      category: EquipmentCategory.Projector,
    });

    expect(output.createdAt).toEqual(now);
    expect(output.updatedAt).toEqual(now);
  });

  it("[正常系] 作成した備品を Repository に保存する", async () => {
    const { useCase, repository } = createUseCase({ id: "eq_saved" });

    await useCase.execute({
      name: "プロジェクターA",
      category: EquipmentCategory.Projector,
    });

    const savedEquipment = await repository.findById("eq_saved");

    expect(savedEquipment?.id).toBe("eq_saved");
    expect(savedEquipment?.name).toBe("プロジェクターA");
    expect(savedEquipment?.category).toBe(EquipmentCategory.Projector);
  });
});

