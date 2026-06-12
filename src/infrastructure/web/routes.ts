import { Router } from "express";

import { CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { MeetingRoomController } from "@interface/controllers/MeetingRoomController";
import { InMemoryMeetingRoomRepository } from "@infrastructure/repositories/InMemoryMeetingRoomRepository";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";

export function createRoutes(): Router {
  const router = Router();

  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const idGenerator = new UuidGenerator();
  const clock = new SystemClock();

  const meetingRoomController = new MeetingRoomController(
    new CreateMeetingRoomUseCase(meetingRoomRepository, idGenerator, clock),
    new ListMeetingRoomsUseCase(meetingRoomRepository),
  );

  router.get("/meeting-rooms", meetingRoomController.list);
  router.post("/meeting-rooms", meetingRoomController.create);

  return router;
}
