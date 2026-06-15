import { type Request, type Response } from "express";
import { z } from "zod";

import { MeetingRoomAlreadyExistsError } from "@application/errors/MeetingRoomApplicationErrors";
import { CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { DomainError } from "@domain/errors/DomainError";
import {
  sendDomainErrorResponse,
  sendErrorResponse,
  sendInternalServerErrorResponse,
  sendZodValidationErrorResponse,
} from "@interface/http/errorResponse";
import { MeetingRoomPresenter } from "@interface/presenters/MeetingRoomPresenter";

const createMeetingRoomRequestBodySchema = z.object({
  name: z.string(),
  capacity: z.number(),
  location: z.string().optional(),
  description: z.string().optional(),
});

const optionalNumberQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return value;
  }

  return Number(value);
}, z.number().optional());

const listMeetingRoomsQuerySchema = z.object({
  capacityGte: optionalNumberQuerySchema,
  location: z.string().optional(),
});

export class MeetingRoomController {
  public constructor(
    private readonly createMeetingRoomUseCase: CreateMeetingRoomUseCase,
    private readonly listMeetingRoomsUseCase: ListMeetingRoomsUseCase,
  ) {}

  public create = async (
    request: Request,
    response: Response,
  ): Promise<void> => {
    try {
      const body = createMeetingRoomRequestBodySchema.parse(request.body);
      const input = {
        name: body.name,
        capacity: body.capacity,
        location: body.location ?? null,
        description: body.description ?? null,
      };
      const output = await this.createMeetingRoomUseCase.execute(input);

      response.status(201).json(MeetingRoomPresenter.presentCreated(output));
    } catch (error) {
      this.handleError(error, response);
    }
  };

  public list = async (request: Request, response: Response): Promise<void> => {
    try {
      const query = listMeetingRoomsQuerySchema.parse(request.query);
      const output = await this.listMeetingRoomsUseCase.execute({
        capacityGte: query.capacityGte,
        location: query.location,
      });

      response.status(200).json(MeetingRoomPresenter.presentList(output));
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
      sendDomainErrorResponse(response, error, { code: "VALIDATION_ERROR" });
      return;
    }

    if (error instanceof MeetingRoomAlreadyExistsError) {
      sendErrorResponse(response, 409, error.code, error.message);
      return;
    }

    sendInternalServerErrorResponse(response);
  }
}
