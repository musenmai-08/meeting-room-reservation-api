import { Router } from "express";

import { InMemoryEquipmentRepository } from "@infrastructure/repositories/InMemoryEquipmentRepository";
import { InMemoryMeetingRoomRepository } from "@infrastructure/repositories/InMemoryMeetingRoomRepository";
import { InMemoryReservationRepository } from "@infrastructure/repositories/InMemoryReservationRepository";
import { createEquipmentRoutes } from "@infrastructure/web/routeFactories/equipmentRoutes";
import { createMeetingRoomRoutes } from "@infrastructure/web/routeFactories/meetingRoomRoutes";
import { createReservationRoutes } from "@infrastructure/web/routeFactories/reservationRoutes";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";

export function createRoutes(): Router {
  const router = Router();

  const meetingRoomRepository = new InMemoryMeetingRoomRepository();
  const equipmentRepository = new InMemoryEquipmentRepository();
  const reservationRepository = new InMemoryReservationRepository();
  const idGenerator = new UuidGenerator();
  const clock = new SystemClock();

  router.use(
    createMeetingRoomRoutes({
      meetingRoomRepository,
      idGenerator,
      clock,
    }),
  );
  router.use(
    createEquipmentRoutes({
      equipmentRepository,
      idGenerator,
      clock,
    }),
  );
  router.use(
    createReservationRoutes({
      reservationRepository,
      meetingRoomRepository,
      equipmentRepository,
      idGenerator,
      clock,
    }),
  );

  return router;
}
