import { Router } from "express";

import { CreateEquipmentUseCase } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { ListEquipmentsUseCase } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { CancelReservationUseCase } from "@application/usecases/reservations/CancelReservationUseCase";
import { CreateReservationUseCase } from "@application/usecases/reservations/CreateReservationUseCase";
import { GetReservationUseCase } from "@application/usecases/reservations/GetReservationUseCase";
import { ListReservationsUseCase } from "@application/usecases/reservations/ListReservationsUseCase";
import { EquipmentController } from "@interface/controllers/EquipmentController";
import { MeetingRoomController } from "@interface/controllers/MeetingRoomController";
import { ReservationController } from "@interface/controllers/ReservationController";
import { InMemoryEquipmentRepository } from "@infrastructure/repositories/InMemoryEquipmentRepository";
import { InMemoryMeetingRoomRepository } from "@infrastructure/repositories/InMemoryMeetingRoomRepository";
import { InMemoryReservationRepository } from "@infrastructure/repositories/InMemoryReservationRepository";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";

export function createRoutes(): Router {
  const router = Router();

  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const equipmentRepository = new InMemoryEquipmentRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const idGenerator = new UuidGenerator();
  const clock = new SystemClock();

  const meetingRoomController = new MeetingRoomController(
    new CreateMeetingRoomUseCase(meetingRoomRepository, idGenerator, clock),
    new ListMeetingRoomsUseCase(meetingRoomRepository),
  );
  const equipmentController = new EquipmentController(
    new CreateEquipmentUseCase(equipmentRepository, idGenerator, clock),
    new ListEquipmentsUseCase(equipmentRepository),
  );
  const reservationController = new ReservationController(
    new CreateReservationUseCase(
      reservationRepository,
      meetingRoomRepository,
      equipmentRepository,
      idGenerator,
      clock,
    ),
    new ListReservationsUseCase(reservationRepository),
    new GetReservationUseCase(reservationRepository),
    new CancelReservationUseCase(reservationRepository, clock),
  );

  router.post("/meeting-rooms", meetingRoomController.create);
  router.get("/meeting-rooms", meetingRoomController.list);

  router.post("/equipments", equipmentController.create);
  router.get("/equipments", equipmentController.list);

  router.post("/reservations", reservationController.create);
  router.get("/reservations", reservationController.list);
  router.get("/reservations/:reservationId", reservationController.get);
  router.patch(
    "/reservations/:reservationId/cancel",
    reservationController.cancel,
  );

  return router;
}
