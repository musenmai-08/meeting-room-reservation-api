import {
  ReservationConflictError,
  ReservationStartAtMustBeFutureError,
} from "@application/errors/ReservationApplicationErrors";
import { ResourceNotFoundError } from "@application/errors/ResourceApplicationErrors";
import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { Reservation } from "@domain/entities/Reservation";
import { ReservationConflictService } from "@domain/services/ReservationConflictService";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

export type CreateReservationInput = {
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  startAt: Date;
  endAt: Date;
  purpose: string;
};

export type CreateReservationOutput = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  userId: string;
  startAt: Date;
  endAt: Date;
  purpose: string;
  status: ReservationStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CreateReservationUseCase {
  public constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly meetingRoomRepository: MeetingRoomRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: CreateReservationInput,
  ): Promise<CreateReservationOutput> {
    await this.ensureResourceExists(input.resourceType, input.resourceId);

    const period = ReservationPeriod.create(input.startAt, input.endAt);
    const now = this.clock.now();

    if (period.isStartedAtOrBefore(now)) {
      throw new ReservationStartAtMustBeFutureError();
    }

    // 既存の予約と重複しないかの確認
    const existingReservations =
      await this.reservationRepository.findByResource({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      });

    if (ReservationConflictService.hasConflict(existingReservations, period)) {
      throw new ReservationConflictError();
    }

    const reservation = Reservation.create({
      id: this.idGenerator.generate(),
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      userId: input.userId,
      period,
      purpose: input.purpose,
      status: ReservationStatus.Reserved,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.reservationRepository.save(reservation);

    return {
      id: reservation.id,
      resourceType: reservation.resourceType,
      resourceId: reservation.resourceId,
      userId: reservation.userId,
      startAt: reservation.period.startAt,
      endAt: reservation.period.endAt,
      purpose: reservation.purpose,
      status: reservation.status,
      cancelledAt: reservation.cancelledAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }

  // 指定されたリソース（会議室または設備）が存在するかを確認するメソッド
  private async ensureResourceExists(
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<void> {
    if (resourceType === ResourceType.MeetingRoom) {
      const meetingRoom = await this.meetingRoomRepository.findById(resourceId);

      if (meetingRoom === null) {
        throw new ResourceNotFoundError(resourceId);
      }

      return;
    }

    const equipment = await this.equipmentRepository.findById(resourceId);

    if (equipment === null) {
      throw new ResourceNotFoundError(resourceId);
    }
  }
}
