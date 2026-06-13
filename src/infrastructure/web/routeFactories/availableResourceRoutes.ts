import { Router } from "express";

import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { SearchAvailableResourcesUseCase } from "@application/usecases/resources/SearchAvailableResourcesUseCase";
import { AvailableResourceController } from "@interface/controllers/AvailableResourceController";

type CreateAvailableResourceDependencies = {
  meetingRoomRepository: MeetingRoomRepository;
  equipmentRepository: EquipmentRepository;
  reservationRepository: ReservationRepository;
};

export function createAvailableResourceRoutes(
  dependencies: CreateAvailableResourceDependencies,
): Router {
  const router = Router();
  const availableResourceController = new AvailableResourceController(
    new SearchAvailableResourcesUseCase(
      dependencies.meetingRoomRepository,
      dependencies.equipmentRepository,
      dependencies.reservationRepository,
    ),
  );

  router.get("/available-resources", availableResourceController.search);

  return router;
}
