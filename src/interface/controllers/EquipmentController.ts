import { type Request, type Response } from "express";
import { z } from "zod";

import { EquipmentAlreadyExistsError } from "@application/errors/EquipmentApplicationErrors";
import { CreateEquipmentUseCase } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { ListEquipmentsUseCase } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { DomainError } from "@domain/errors/DomainError";
import { EquipmentCategory } from "@domain/valueObjects/EquipmentCategory";
import { EquipmentPresenter } from "@interface/presenters/EquipmentPresenter";

const equipmentCategorySchema = z.enum([
  EquipmentCategory.Projector,
  EquipmentCategory.Monitor,
  EquipmentCategory.Microphone,
  EquipmentCategory.Speaker,
  EquipmentCategory.Whiteboard,
  EquipmentCategory.Other,
]);

const createEquipmentRequestBodySchema = z.object({
  name: z.string(),
  category: equipmentCategorySchema,
  location: z.string().optional(),
  description: z.string().optional(),
});

const listEquipmentsQuerySchema = z.object({
  category: equipmentCategorySchema.optional(),
  location: z.string().optional(),
});

export class EquipmentController {
  public constructor(
    private readonly createEquipmentUseCase: CreateEquipmentUseCase,
    private readonly listEquipmentsUseCase: ListEquipmentsUseCase,
  ) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const body = createEquipmentRequestBodySchema.parse(request.body);
      const output = await this.createEquipmentUseCase.execute({
        name: body.name,
        category: body.category,
        location: body.location ?? null,
        description: body.description ?? null,
      });

      response.status(201).json(EquipmentPresenter.presentCreated(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    try {
      const query = listEquipmentsQuerySchema.parse(request.query);
      const output = await this.listEquipmentsUseCase.execute({
        category: query.category,
        location: query.location,
      });

      response.status(200).json(EquipmentPresenter.presentList(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  private handleError(error: unknown, response: Response): void {
    if (error instanceof z.ZodError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request.",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    if (error instanceof DomainError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof EquipmentAlreadyExistsError) {
      response.status(409).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    // 現状 EquipmentAlreadyExistsError で ApplicationError は対応できており、
    // 下記の分岐に到達するパターンがほぼないのでコメントアウト
    // if (error instanceof ApplicationError) {
    //   response.status(400).json({
    //     error: {
    //       code: error.code,
    //       message: error.message,
    //     },
    //   });
    //   return;
    // }

    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error.",
      },
    });
  }
}
