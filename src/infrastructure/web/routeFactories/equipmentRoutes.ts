import { Router } from "express";

import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { CreateEquipmentUseCase } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { ListEquipmentsUseCase } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { EquipmentController } from "@interface/controllers/EquipmentController";

type CreateEquipmentRoutesDependencies = {
  equipmentRepository: EquipmentRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export function createEquipmentRoutes(
  dependencies: CreateEquipmentRoutesDependencies,
): Router {
  const router = Router();
  const equipmentController = new EquipmentController(
    new CreateEquipmentUseCase(
      dependencies.equipmentRepository,
      dependencies.idGenerator,
      dependencies.clock,
    ),
    new ListEquipmentsUseCase(dependencies.equipmentRepository),
  );

  router.post("/equipments", equipmentController.create);
  router.get("/equipments", equipmentController.list);

  return router;
}
