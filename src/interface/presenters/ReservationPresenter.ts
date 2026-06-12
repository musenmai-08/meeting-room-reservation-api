import { type CancelReservationOutput } from "@application/usecases/reservations/CancelReservationUseCase";
import { type CreateReservationOutput } from "@application/usecases/reservations/CreateReservationUseCase";
import { type GetReservationOutput } from "@application/usecases/reservations/GetReservationUseCase";
import { type ListReservationsOutput } from "@application/usecases/reservations/ListReservationsUseCase";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

type ReservationResponse = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  startAt: string;
  endAt: string;
  purpose: string;
  status: ReservationStatus;
  cancelledAt: string | null;
};

type DetailedReservationResponse = ReservationResponse & {
  createdAt: string;
  updatedAt: string;
};

export class ReservationPresenter {
  public static presentCreated(
    output: CreateReservationOutput,
  ): DetailedReservationResponse {
    return this.presentDetailed(output);
  }

  public static presentDetail(
    output: GetReservationOutput,
  ): DetailedReservationResponse {
    return this.presentDetailed(output);
  }

  public static presentCancelled(output: CancelReservationOutput): {
    id: string;
    status: ReservationStatus;
    cancelledAt: string | null;
  } {
    return {
      id: output.id,
      status: output.status,
      cancelledAt: this.presentNullableDate(output.cancelledAt),
    };
  }

  public static presentList(output: ListReservationsOutput): {
    items: ReservationResponse[];
  } {
    return {
      items: output.items.map((item) => ({
        id: item.id,
        resourceType: item.resourceType,
        resourceId: item.resourceId,
        userId: item.userId,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        purpose: item.purpose,
        status: item.status,
        cancelledAt: this.presentNullableDate(item.cancelledAt),
      })),
    };
  }

  private static presentDetailed(
    output: CreateReservationOutput | GetReservationOutput,
  ): DetailedReservationResponse {
    return {
      id: output.id,
      resourceType: output.resourceType,
      resourceId: output.resourceId,
      userId: output.userId,
      startAt: output.startAt.toISOString(),
      endAt: output.endAt.toISOString(),
      purpose: output.purpose,
      status: output.status,
      cancelledAt: this.presentNullableDate(output.cancelledAt),
      createdAt: output.createdAt.toISOString(),
      updatedAt: output.updatedAt.toISOString(),
    };
  }

  private static presentNullableDate(date: Date | null): string | null {
    return date === null ? null : date.toISOString();
  }
}
