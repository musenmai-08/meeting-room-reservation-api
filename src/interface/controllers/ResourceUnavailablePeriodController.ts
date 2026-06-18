import { type Request, type Response } from "express";
import { z } from "zod";

import { ResourceNotFoundError } from "@application/errors/ResourceApplicationErrors";
import {
  ResourceUnavailablePeriodConflictError,
  ResourceUnavailablePeriodNotFoundError,
  ResourceUnavailablePeriodReservationConflictError,
} from "@application/errors/ResourceUnavailablePeriodError";
import { CreateResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CreateResourceUnavailablePeriodUseCase";
import { DomainError } from "@domain/errors/DomainError";
import { ResourceUnavailablePeriodAlreadyCancelledError } from "@domain/errors/ResourceUnavailablePeriodErrors";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import {
  sendDomainErrorResponse,
  sendErrorResponse,
  sendInternalServerErrorResponse,
  sendZodValidationErrorResponse,
} from "@interface/http/errorResponse";
import { ListResourceUnavailablePeriodsUseCase } from "@application/usecases/resourceUnavailablePeriods/ListResourceUnavailablePeriodsUseCase";
import { ResourceUnavailablePeriodPresenter } from "@interface/presenters/ResourceUnavailablePeriodPresenter";
import { GetResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/GetResourceUnavailablePeriodUseCase";
import { CancelResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CancelResourceUnavailablePeriodUseCase";

const resourceTypeSchema = z.enum([
  ResourceType.MeetingRoom,
  ResourceType.Equipment,
]);

const resourceUnavailablePeriodStatusSchema = z.enum([
  ResourceUnavailablePeriodStatus.Active,
  ResourceUnavailablePeriodStatus.Cancelled,
]);

const dateTimeStringSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const createResourceUnavailablePeriodRequestBodySchema = z.object({
  resourceType: resourceTypeSchema,
  resourceId: z.string(),
  operatorId: z.string(),
  startAt: dateTimeStringSchema,
  endAt: dateTimeStringSchema,
  reason: z.string(),
});

const listResourceUnavailablePeriodsQuerySchema = z.object({
  resourceType: resourceTypeSchema.optional(),
  resourceId: z.string().optional(),
  status: resourceUnavailablePeriodStatusSchema.optional(),
  from: dateTimeStringSchema.optional(),
  to: dateTimeStringSchema.optional(),
});

const resourceUnavailablePeriodParamsSchema = z.object({
  resourceUnavailablePeriodId: z.string(),
});

// const cancelResourceUnavailablePeriodRequestBodySchema = z.object({
//   operatorId: z.string(),
// });

export class ResourceUnavailablePeriodController {
  public constructor(
    private readonly createResourceUnavailablePeriodUseCase: CreateResourceUnavailablePeriodUseCase,
    private readonly listResourceUnavailablePeriodsUseCase: ListResourceUnavailablePeriodsUseCase,
    private readonly getResourceUnavailablePeriodUseCase: GetResourceUnavailablePeriodUseCase,
    private readonly cancelResourceUnavailablePeriodUseCase: CancelResourceUnavailablePeriodUseCase,
  ) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const body = createResourceUnavailablePeriodRequestBodySchema.parse(
        request.body,
      );
      const output = await this.createResourceUnavailablePeriodUseCase.execute({
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        operatorId: body.operatorId,
        startAt: body.startAt,
        endAt: body.endAt,
        reason: body.reason,
      });

      response
        .status(201)
        .json(ResourceUnavailablePeriodPresenter.presentCreated(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    try {
      const query = listResourceUnavailablePeriodsQuerySchema.parse(
        request.query,
      );
      const output = await this.listResourceUnavailablePeriodsUseCase.execute({
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        status: query.status,
        from: query.from,
        to: query.to,
      });

      response
        .status(200)
        .json(ResourceUnavailablePeriodPresenter.presentList(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public get = async (request: Request, response: Response): Promise<void> => {
    try {
      const params = resourceUnavailablePeriodParamsSchema.parse(
        request.params,
      );
      const output = await this.getResourceUnavailablePeriodUseCase.execute({
        id: params.resourceUnavailablePeriodId,
      });

      response
        .status(200)
        .json(ResourceUnavailablePeriodPresenter.presentDetail(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public cancel = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const query = resourceUnavailablePeriodParamsSchema.parse(request.params);
      // const body = cancelResourceUnavailablePeriodRequestBodySchema.parse(
      //   request.body,
      // );
      const output = await this.cancelResourceUnavailablePeriodUseCase.execute({
        id: query.resourceUnavailablePeriodId,
        // operatorId: body.operatorId,
      });

      response
        .status(200)
        .json(ResourceUnavailablePeriodPresenter.presentCancelled(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  private handleError(error: unknown, response: Response): void {
    if (error instanceof z.ZodError) {
      sendZodValidationErrorResponse(response, error);
      return;
    }

    if (
      error instanceof ResourceNotFoundError ||
      error instanceof ResourceUnavailablePeriodNotFoundError
    ) {
      sendErrorResponse(response, 404, error.code, error.message);
      return;
    }

    if (
      error instanceof ResourceUnavailablePeriodConflictError ||
      error instanceof ResourceUnavailablePeriodReservationConflictError ||
      error instanceof ResourceUnavailablePeriodAlreadyCancelledError
    ) {
      sendErrorResponse(response, 409, error.code, error.message);
      return;
    }

    if (error instanceof DomainError) {
      sendDomainErrorResponse(response, error);
      return;
    }

    sendInternalServerErrorResponse(response);
  }
}
