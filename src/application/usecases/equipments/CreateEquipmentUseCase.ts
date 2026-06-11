import { EquipmentAlreadyExistsError } from "@application/errors/EquipmentApplicationErrors";
import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { Equipment } from "@domain/entities/Equipment";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";

export type CreateEquipmentInput = {
  name: string;
  category: EquipmentCategory;
  location?: string | null;
  description?: string | null;
};

export type CreateEquipmentOutput = {
  id: string;
  name: string;
  category: EquipmentCategory;
  location: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CreateEquipmentUseCase {
  public constructor(
    private readonly equipmentRepository: EquipmentRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: CreateEquipmentInput,
  ): Promise<CreateEquipmentOutput> {
    const name = input.name.trim();
    const existingEquipment = await this.equipmentRepository.findByName(name);

    if (existingEquipment !== null) {
      throw new EquipmentAlreadyExistsError(name);
    }

    const now = this.clock.now();
    const equipment = Equipment.create({
      id: this.idGenerator.generate(),
      name,
      category: input.category,
      location: input.location ?? null,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await this.equipmentRepository.save(equipment);

    return {
      id: equipment.id,
      name: equipment.name,
      category: equipment.category,
      location: equipment.location,
      description: equipment.description,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }
}

