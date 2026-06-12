import { type Request, type Response } from "express";
import { z } from "zod";

import { ApplicationError } from "@application/errors/ApplicationError";
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

  public create = async (request: Request, response: Response): Promise<void> => {
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

    if (
      error instanceof ResourceNotFoundError ||
      error instanceof ReservationNotFoundError
    ) {
      response.status(404).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    if (
      error instanceof ReservationConflictError ||
      error instanceof AlreadyCancelledError
    ) {
      response.status(409).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof ReservationCancellationForbiddenError) {
      response.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof DomainError || error instanceof ApplicationError) {
      response.status(400).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected error.",
      },
    });
  }
}
