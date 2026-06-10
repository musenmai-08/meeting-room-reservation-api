import { InvalidEquipmentError } from "../errors/EquipmentErrors";
import {
  type EquipmentCategory,
  isEquipmentCategory,
} from "../valueObjects/EquipmentCategory";

type EquipmentProps = {
  id: string;
  name: string;
  category: EquipmentCategory;
  location: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Equipment {
  // Entity は ID で同一性を判断するため、値は private に閉じ込めます。
  private constructor(private readonly props: EquipmentProps) {}

  public static create(props: EquipmentProps): Equipment {
    const name = props.name.trim();

    if (props.id.trim().length === 0) {
      throw new InvalidEquipmentError("id is required.");
    }

    if (name.length === 0 || name.length > 100) {
      throw new InvalidEquipmentError(
        "name must be between 1 and 100 characters.",
      );
    }

    if (!isEquipmentCategory(props.category)) {
      throw new InvalidEquipmentError("category is invalid.");
    }

    if (!Equipment.isValidDate(props.createdAt)) {
      throw new InvalidEquipmentError("createdAt must be a valid date.");
    }

    if (!Equipment.isValidDate(props.updatedAt)) {
      throw new InvalidEquipmentError("updatedAt must be a valid date.");
    }

    return new Equipment({
      ...props,
      name,
      // Date は mutable なので、Entity の外から変更されないよう clone します。
      createdAt: Equipment.cloneDate(props.createdAt),
      updatedAt: Equipment.cloneDate(props.updatedAt),
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get category(): EquipmentCategory {
    return this.props.category;
  }

  public get location(): string | null {
    return this.props.location;
  }

  public get description(): string | null {
    return this.props.description;
  }

  public get createdAt(): Date {
    return Equipment.cloneDate(this.props.createdAt);
  }

  public get updatedAt(): Date {
    return Equipment.cloneDate(this.props.updatedAt);
  }

  public equals(other: Equipment): boolean {
    return this.id === other.id;
  }

  private static isValidDate(date: Date): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  private static cloneDate(date: Date): Date {
    return new Date(date.getTime());
  }
}
