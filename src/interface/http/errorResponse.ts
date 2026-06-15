import { type Response } from "express";
import { z } from "zod";

import { DomainError } from "@domain/errors/DomainError";

type ErrorDetail = {
  path: string;
  message: string;
};

type ErrorResponseOptions = {
  details?: ErrorDetail[];
};

export function sendErrorResponse(
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  options: ErrorResponseOptions = {},
): void {
  response.status(statusCode).json({
    error: {
      code,
      message,
      ...(options.details === undefined ? {} : { details: options.details }),
    },
  });
}

export function sendZodValidationErrorResponse(
  response: Response,
  error: z.ZodError,
): void {
  sendErrorResponse(response, 400, "VALIDATION_ERROR", "Invalid request.", {
    details: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export function sendDomainErrorResponse(
  response: Response,
  error: DomainError,
  options: { code?: string } = {},
): void {
  sendErrorResponse(response, 400, options.code ?? error.code, error.message);
}

export function sendInternalServerErrorResponse(response: Response): void {
  sendErrorResponse(
    response,
    500,
    "INTERNAL_SERVER_ERROR",
    "Unexpected error.",
  );
}
