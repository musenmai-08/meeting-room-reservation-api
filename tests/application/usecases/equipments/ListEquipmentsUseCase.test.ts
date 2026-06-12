import { describe, expect, it } from "vitest";

import { ListEquipmentsUseCase } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { Equipment } from "@domain/entities/Equipment";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { InMemoryEquipmentRepository } from "@infrastructure/repositories/InMemoryEquipmentRepository";

type EquipmentFactoryProps = Parameters<typeof Equipment.create>[0];

const date = (isoString: string): Date => new Date(isoString);

const createTestEquipment = (
  overrides: Partial<EquipmentFactoryProps> = {},
): Equipment =>
  Equipment.create({
    id: "eq_001",
    name: "プロジェクターA",
    category: EquipmentCategory.Projector,
    location: "東京本社 2F",
    description: "HDMI対応",
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("ListEquipmentsUseCase", () => {
  it("[正常系] 備品一覧を取得できる", async () => {
    const repository = new InMemoryEquipmentRepository();
    await repository.save(createTestEquipment({ id: "eq_001", name: "備品A" }));
    await repository.save(createTestEquipment({ id: "eq_002", name: "備品B" }));
    const useCase = new ListEquipmentsUseCase(repository);

    const output = await useCase.execute();

    expect(output.items).toHaveLength(2);
    expect(output.items.map((item) => item.id)).toEqual(["eq_001", "eq_002"]);
  });

  it("[正常系] category で絞り込める", async () => {
    const repository = new InMemoryEquipmentRepository();
    await repository.save(
      createTestEquipment({
        id: "eq_001",
        name: "プロジェクターA",
        category: EquipmentCategory.Projector,
      }),
    );
    await repository.save(
      createTestEquipment({
        id: "eq_002",
        name: "モニターA",
        category: EquipmentCategory.Monitor,
      }),
    );
    const useCase = new ListEquipmentsUseCase(repository);

    const output = await useCase.execute({
      category: EquipmentCategory.Monitor,
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("eq_002");
  });

  it("[正常系] location で絞り込める", async () => {
    const repository = new InMemoryEquipmentRepository();
    await repository.save(
      createTestEquipment({
        id: "eq_001",
        name: "備品A",
        location: "東京本社 2F",
      }),
    );
    await repository.save(
      createTestEquipment({
        id: "eq_002",
        name: "備品B",
        location: "大阪支社 2F",
      }),
    );
    const useCase = new ListEquipmentsUseCase(repository);

    const output = await useCase.execute({ location: "大阪支社 2F" });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("eq_002");
  });

  it("[正常系] UseCase の出力が一覧用 DTO の形になる", async () => {
    const repository = new InMemoryEquipmentRepository();
    await repository.save(createTestEquipment());
    const useCase = new ListEquipmentsUseCase(repository);

    const output = await useCase.execute();

    expect(output).toEqual({
      items: [
        {
          id: "eq_001",
          name: "プロジェクターA",
          category: EquipmentCategory.Projector,
          location: "東京本社 2F",
          description: "HDMI対応",
        },
      ],
    });
  });
});

