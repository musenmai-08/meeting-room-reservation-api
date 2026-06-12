import { Router } from "express";

import { EquipmentRepository } from "@application/repositories/EquipmentRepository";
import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { ReservationRepository } from "@application/repositories/ReservationRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { CancelReservationUseCase } from "@application/usecases/reservations/CancelReservationUseCase";
import { CreateReservationUseCase } from "@application/usecases/reservations/CreateReservationUseCase";
import { GetReservationUseCase } from "@application/usecases/reservations/GetReservationUseCase";
import { ListReservationsUseCase } from "@application/usecases/reservations/ListReservationsUseCase";
import { ReservationController } from "@interface/controllers/ReservationController";

type CreateReservationRoutesDependencies = {
  reservationRepository: ReservationRepository;
  meetingRoomRepository: MeetingRoomRepository;
  equipmentRepository: EquipmentRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export function createReservationRoutes(
  dependencies: CreateReservationRoutesDependencies,
): Router {
  const router = Router();
  const reservationController = new ReservationController(
    new CreateReservationUseCase(
      dependencies.reservationRepository,
      dependencies.meetingRoomRepository,
      dependencies.equipmentRepository,
      dependencies.idGenerator,
      dependencies.clock,
    ),
    new ListReservationsUseCase(dependencies.reservationRepository),
    new GetReservationUseCase(dependencies.reservationRepository),
    new CancelReservationUseCase(
      dependencies.reservationRepository,
      dependencies.clock,
    ),
  );

  router.post("/reservations", reservationController.create);
  router.get("/reservations", reservationController.list);
  router.get("/reservations/:reservationId", reservationController.get);
  router.patch(
    "/reservations/:reservationId/cancel",
    reservationController.cancel,
  );

  return router;
}
