import { type Request, type Response } from "express";
import { z } from "zod";

import { SearchAvailableResourcesUseCase } from "@application/usecases/resources/SearchAvailableResourcesUseCase";
import { DomainError } from "@domain/errors/DomainError";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import {
  sendDomainErrorResponse,
  sendInternalServerErrorResponse,
  sendZodValidationErrorResponse,
} from "@interface/http/errorResponse";
import { AvailableResourcePresenter } from "@interface/presenters/AvailableResourcePresenter";

const resourceTypeSchema = z.enum([
  ResourceType.MeetingRoom,
  ResourceType.Equipment,
]);

const dateTimeStringSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const optionalNumberQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return value;
  }

  return Number(value);
}, z.number().optional());

const equipmentCategorySchema = z.enum([
  EquipmentCategory.Projector,
  EquipmentCategory.Monitor,
  EquipmentCategory.Microphone,
  EquipmentCategory.Speaker,
  EquipmentCategory.Whiteboard,
  EquipmentCategory.Other,
]);

const listAvailableResourceQuerySchema = z.object({
  resourceType: resourceTypeSchema,
  startAt: dateTimeStringSchema,
  endAt: dateTimeStringSchema,
  capacityGte: optionalNumberQuerySchema,
  category: equipmentCategorySchema.optional(),
});

export class AvailableResourceController {
  public constructor(
    private readonly searchAvailableResourcesUseCase: SearchAvailableResourcesUseCase,
  ) {}

  public search = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const query = listAvailableResourceQuerySchema.parse(request.query);
      const output = await this.searchAvailableResourcesUseCase.execute(query);

      response.status(200).json(AvailableResourcePresenter.presentList(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  private handleError(error: unknown, response: Response): void {
    if (error instanceof z.ZodError) {
      sendZodValidationErrorResponse(response, error);
      return;
    }

    if (error instanceof DomainError) {
      sendDomainErrorResponse(response, error);
      return;
    }

    sendInternalServerErrorResponse(response);
  }
}
