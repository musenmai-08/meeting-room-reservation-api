import { ResourceNotFoundError } from "@application/errors/ResourceApplicationErrors";
import {
  ResourceUnavailablePeriodConflictError,
  ResourceUnavailablePeriodReservationConflictError,
  ResourceUnavailablePeriodStartAtMustBeFutureError,
} from "@application/errors/ResourceUnavailablePeriodError";
import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { ResourceUnavailablePeriodRepository } from "@application/repositories/ResourceUnavailablePeriodRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { ResourceUnavailablePeriod } from "@domain/entities/ResourceUnavailablePeriod";
import { ResourceUnavailablePeriodConflictService } from "@domain/services/ResourceUnavailablePeriodConflictService";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";
import { UnavailablePeriod } from "@domain/valueObjects/UnavailablePeriod";

export type CreateResourceUnavailablePeriodInput = {
  resourceType: ResourceType;
  resourceId: string;
  operatorId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
};

export type CreateResourceUnavailablePeriodOutput = {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  operatorId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  status: ResourceUnavailablePeriodStatus;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class CreateResourceUnavailablePeriodUseCase {
  public constructor(
    private readonly resourceUnavailablePeriodRepository: ResourceUnavailablePeriodRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly meetingRoomRepository: MeetingRoomRepository,
    private readonly equipmentRepository: EquipmentRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: CreateResourceUnavailablePeriodInput,
  ): Promise<CreateResourceUnavailablePeriodOutput> {
    await this.ensureResourceExists(input.resourceType, input.resourceId);

    const period = UnavailablePeriod.create(input.startAt, input.endAt);
    const now = this.clock.now();

    if (period.isStartedAtOrBefore(now)) {
      throw new ResourceUnavailablePeriodStartAtMustBeFutureError();
    }

    // 同一リソースの既存利用停止枠と、新しい利用停止期間が重複しているかを判定
    const existingResourceUnavailablePeriod =
      await this.resourceUnavailablePeriodRepository.findByResource({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      });
    if (
      ResourceUnavailablePeriodConflictService.hasConflictWithUnavailablePeriods(
        existingResourceUnavailablePeriod,
        period,
      )
    ) {
      throw new ResourceUnavailablePeriodConflictError();
    }

    // 新規利用停止枠が既存予約と重なっているかを見る
    const existingReservations =
      await this.reservationRepository.findByResource({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      });
    if (
      ResourceUnavailablePeriodConflictService.hasConflictWithReservations(
        existingReservations,
        period,
      )
    ) {
      throw new ResourceUnavailablePeriodReservationConflictError();
    }

    const resourceUnavailablePeriod = ResourceUnavailablePeriod.create({
      id: this.idGenerator.generate(),
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      operatorId: input.operatorId,
      period: period,
      reason: input.reason,
      status: ResourceUnavailablePeriodStatus.Active,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.resourceUnavailablePeriodRepository.save(
      resourceUnavailablePeriod,
    );

    return {
      id: resourceUnavailablePeriod.id,
      resourceType: resourceUnavailablePeriod.resourceType,
      resourceId: resourceUnavailablePeriod.resourceId,
      operatorId: resourceUnavailablePeriod.operatorId,
      startAt: resourceUnavailablePeriod.period.startAt,
      endAt: resourceUnavailablePeriod.period.endAt,
      reason: resourceUnavailablePeriod.reason,
      status: resourceUnavailablePeriod.status,
      cancelledAt: resourceUnavailablePeriod.cancelledAt,
      createdAt: resourceUnavailablePeriod.createdAt,
      updatedAt: resourceUnavailablePeriod.updatedAt,
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
