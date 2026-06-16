import { Router } from "express";

import { createAvailableResourceRoutes } from "@infrastructure/web/routeFactories/availableResourceRoutes";
import { createEquipmentRoutes } from "@infrastructure/web/routeFactories/equipmentRoutes";
import { createMeetingRoomRoutes } from "@infrastructure/web/routeFactories/meetingRoomRoutes";
import { createReservationRoutes } from "@infrastructure/web/routeFactories/reservationRoutes";
import { SystemClock } from "@infrastructure/services/SystemClock";
import { UuidGenerator } from "@infrastructure/services/UuidGenerator";
import { PrismaMeetingRoomRepository } from "@infrastructure/prisma/repositories/PrismaMeetingRoomRepository";
import { PrismaEquipmentRepository } from "@infrastructure/prisma/repositories/PrismaEquipmentRepository";
import { PrismaReservationRepository } from "@infrastructure/prisma/repositories/PrismaReservationRepository";

export function createRoutes(): Router {
  const router = Router();

  const meetingRoomRepository = new PrismaMeetingRoomRepository();
  const equipmentRepository = new PrismaEquipmentRepository();
  const reservationRepository = new PrismaReservationRepository();
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
  router.use(
    createAvailableResourceRoutes({
      meetingRoomRepository,
      equipmentRepository,
      reservationRepository,
    }),
  );

  return router;
}
