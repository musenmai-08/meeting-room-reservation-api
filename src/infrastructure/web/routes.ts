import { Router } from "express";

import { CreateEquipmentUseCase } from "@application/usecases/equipments/CreateEquipmentUseCase";
import { ListEquipmentsUseCase } from "@application/usecases/equipments/ListEquipmentsUseCase";
import { CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { EquipmentController } from "@interface/controllers/EquipmentController";
import { MeetingRoomController } from "@interface/controllers/MeetingRoomController";
import { InMemoryEquipmentRepository } from "@infrastructure/repositories/InMemoryEquipmentRepository";
import { InMemoryMeetingRoomRepository } from "@infrastructure/repositories/InMemoryMeetingRoomRepository";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";

export function createRoutes(): Router {
  const router = Router();

  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const equipmentRepository = new InMemoryEquipmentRepository();
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

  router.post("/meeting-rooms", meetingRoomController.create);
  router.get("/meeting-rooms", meetingRoomController.list);

  router.post("/equipments", equipmentController.create);
  router.get("/equipments", equipmentController.list);

  return router;
}
