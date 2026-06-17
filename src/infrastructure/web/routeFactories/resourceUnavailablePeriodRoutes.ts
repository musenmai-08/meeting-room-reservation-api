import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { ResourceUnavailablePeriodRepository } from "@application/repositories/ResourceUnavailablePeriodRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { CancelResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CancelResourceUnavailablePeriodUseCase";
import { CreateResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/CreateResourceUnavailablePeriodUseCase";
import { GetResourceUnavailablePeriodUseCase } from "@application/usecases/resourceUnavailablePeriods/GetResourceUnavailablePeriodUseCase";
import { ListResourceUnavailablePeriodsUseCase } from "@application/usecases/resourceUnavailablePeriods/ListResourceUnavailablePeriodsUseCase";
import { ResourceUnavailablePeriodController } from "@interface/controllers/ResourceUnavailablePeriodController";
import { Router } from "express";

type CreateResourceUnavailablePeriodRoutes = {
  resourceUnavailablePeriodRepository: ResourceUnavailablePeriodRepository;
  reservationRepository: ReservationRepository;
  meetingRoomRepository: MeetingRoomRepository;
  equipmentRepository: EquipmentRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export function resourceUnavailablePeriodRoutes(
  dependencies: CreateResourceUnavailablePeriodRoutes,
): Router {
  const router = Router();
  const resourceUnavailablePeriodController =
    new ResourceUnavailablePeriodController(
      new CreateResourceUnavailablePeriodUseCase(
        dependencies.resourceUnavailablePeriodRepository,
        dependencies.reservationRepository,
        dependencies.meetingRoomRepository,
        dependencies.equipmentRepository,
        dependencies.idGenerator,
        dependencies.clock,
      ),
      new ListResourceUnavailablePeriodsUseCase(
        dependencies.resourceUnavailablePeriodRepository,
      ),
      new GetResourceUnavailablePeriodUseCase(
        dependencies.resourceUnavailablePeriodRepository,
      ),
      new CancelResourceUnavailablePeriodUseCase(
        dependencies.resourceUnavailablePeriodRepository,
        dependencies.clock,
      ),
    );

  router.post(
    "/resource-unavailable-periods",
    resourceUnavailablePeriodController.create,
  );
  router.get(
    "/resource-unavailable-periods",
    resourceUnavailablePeriodController.list,
  );
  router.get(
    "/resource-unavailable-periods/:resourceUnavailablePeriodId",
    resourceUnavailablePeriodController.get,
  );
  router.post(
    "/resource-unavailable-periods/:resourceUnavailablePeriodId/cancel",
    resourceUnavailablePeriodController.cancel,
  );

  return router;
}
