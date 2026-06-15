import { type Request, type Response } from "express";
import { z } from "zod";

import {
  ReservationConflictError,
  ReservationNotFoundError,
} from "@application/errors/ReservationApplicationErrors";
import { ResourceNotFoundError } from "@application/errors/ResourceApplicationErrors";
import { CancelReservationUseCase } from "@application/usecases/reservations/CancelReservationUseCase";
import { CreateReservationUseCase } from "@application/usecases/reservations/CreateReservationUseCase";
import { GetReservationUseCase } from "@application/usecases/reservations/GetReservationUseCase";
import { ListReservationsUseCase } from "@application/usecases/reservations/ListReservationsUseCase";
import {
  AlreadyCancelledError,
  ReservationCancellationForbiddenError,
} from "@domain/errors/ReservationErrors";
import { DomainError } from "@domain/errors/DomainError";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import {
  sendDomainErrorResponse,
  sendErrorResponse,
  sendInternalServerErrorResponse,
  sendZodValidationErrorResponse,
} from "@interface/http/errorResponse";
import { ReservationPresenter } from "@interface/presenters/ReservationPresenter";

const resourceTypeSchema = z.enum([
  ResourceType.MeetingRoom,
  ResourceType.Equipment,
]);

const reservationStatusSchema = z.enum([
  ReservationStatus.Reserved,
  ReservationStatus.Cancelled,
]);

const dateTimeStringSchema = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const createReservationRequestBodySchema = z.object({
  resourceType: resourceTypeSchema,
  resourceId: z.string(),
  userId: z.string(),
  startAt: dateTimeStringSchema,
  endAt: dateTimeStringSchema,
  purpose: z.string(),
});

const listReservationsQuerySchema = z.object({
  userId: z.string().optional(),
  resourceType: resourceTypeSchema.optional(),
  resourceId: z.string().optional(),
  status: reservationStatusSchema.optional(),
  from: dateTimeStringSchema.optional(),
  to: dateTimeStringSchema.optional(),
});

const reservationParamsSchema = z.object({
  reservationId: z.string(),
});

const cancelReservationRequestBodySchema = z.object({
  userId: z.string(),
});

export class ReservationController {
  public constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly getReservationUseCase: GetReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
  ) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const body = createReservationRequestBodySchema.parse(request.body);
      const output = await this.createReservationUseCase.execute({
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        userId: body.userId,
        startAt: body.startAt,
        endAt: body.endAt,
        purpose: body.purpose,
      });

      response.status(201).json(ReservationPresenter.presentCreated(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    try {
      const query = listReservationsQuerySchema.parse(request.query);
      const output = await this.listReservationsUseCase.execute({
        userId: query.userId,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        status: query.status,
        from: query.from,
        to: query.to,
      });

      response.status(200).json(ReservationPresenter.presentList(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public get = async (request: Request, response: Response): Promise<void> => {
    try {
      const params = reservationParamsSchema.parse(request.params);
      const output = await this.getReservationUseCase.execute({
        reservationId: params.reservationId,
      });

      response.status(200).json(ReservationPresenter.presentDetail(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public cancel = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const params = reservationParamsSchema.parse(request.params);
      const body = cancelReservationRequestBodySchema.parse(request.body);
      const output = await this.cancelReservationUseCase.execute({
        reservationId: params.reservationId,
        userId: body.userId,
      });

      response.status(200).json(ReservationPresenter.presentCancelled(output));
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
      error instanceof ReservationNotFoundError
    ) {
      sendErrorResponse(response, 404, error.code, error.message);
      return;
    }

    if (
      error instanceof ReservationConflictError ||
      error instanceof AlreadyCancelledError
    ) {
      sendErrorResponse(response, 409, error.code, error.message);
      return;
    }

    if (error instanceof ReservationCancellationForbiddenError) {
      sendErrorResponse(response, 403, "FORBIDDEN", error.message);
      return;
    }

    if (error instanceof DomainError) {
      sendDomainErrorResponse(response, error);
      return;
    }

    sendInternalServerErrorResponse(response);
  }
}
