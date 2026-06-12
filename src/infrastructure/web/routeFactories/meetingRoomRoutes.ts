import { Router } from "express";

import { MeetingRoomRepository } from "@application/repositories/MeetingRoomRepository";
import { Clock } from "@application/services/Clock";
import { IdGenerator } from "@application/services/IdGenerator";
import { CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { MeetingRoomController } from "@interface/controllers/MeetingRoomController";

type CreateMeetingRoomRoutesDependencies = {
  meetingRoomRepository: MeetingRoomRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export function createMeetingRoomRoutes(
  dependencies: CreateMeetingRoomRoutesDependencies,
): Router {
  const router = Router();
  const meetingRoomController = new MeetingRoomController(
    new CreateMeetingRoomUseCase(
      dependencies.meetingRoomRepository,
      dependencies.idGenerator,
      dependencies.clock,
    ),
    new ListMeetingRoomsUseCase(dependencies.meetingRoomRepository),
  );

  router.post("/meeting-rooms", meetingRoomController.create);
  router.get("/meeting-rooms", meetingRoomController.list);

  return router;
}
