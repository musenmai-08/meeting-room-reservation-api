import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { PrismaClient } from "../../../../src/generated/prisma/client";
import { PrismaMeetingRoomRepository } from "@infrastructure/prisma/repositories/PrismaMeetingRoomRepository";
import { createPrismaTestDatabase } from "../prismaTestDatabase";

type MeetingRoomFactoryProps = Parameters<typeof MeetingRoom.create>[0];

const date = (isoString: string): Date => new Date(isoString);

const createTestMeetingRoom = (
  overrides: Partial<MeetingRoomFactoryProps> = {},
): MeetingRoom =>
  MeetingRoom.create({
    id: "mr_001",
    name: "会議室A",
    capacity: 8,
    location: "東京本社 3F",
    description: "モニターあり",
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("PrismaMeetingRoomRepository", () => {
  let client: PrismaClient;
  let repository: PrismaMeetingRoomRepository;
  let cleanupDatabase: () => Promise<void>;

  beforeAll(async () => {
    const testDatabase = await createPrismaTestDatabase();
    client = testDatabase.client;
    cleanupDatabase = testDatabase.cleanup;
    repository = new PrismaMeetingRoomRepository(client);
  });

  // 各テストの前に MeetingRoom テーブルを空にする
  beforeEach(async () => {
    await client.meetingRoom.deleteMany();
  });

  // すべてのテストが終わったあとに実行される後片付け
  afterAll(async () => {
    await cleanupDatabase();
  });

  describe("save / findById", () => {
    it("[正常系] save した MeetingRoom を findById で取得できる", async () => {
      const meetingRoom = createTestMeetingRoom();

      await repository.save(meetingRoom);

      const foundMeetingRoom = await repository.findById("mr_001");

      expect(foundMeetingRoom).not.toBeNull();
      expect(foundMeetingRoom?.id).toBe("mr_001");
      expect(foundMeetingRoom?.name).toBe("会議室A");
      expect(foundMeetingRoom?.capacity).toBe(8);
      expect(foundMeetingRoom?.location).toBe("東京本社 3F");
      expect(foundMeetingRoom?.description).toBe("モニターあり");
    });

    it("[正常系] 同じ id で save すると更新される", async () => {
      await repository.save(createTestMeetingRoom());
      await repository.save(
        createTestMeetingRoom({
          name: "会議室A 更新後",
          capacity: 10,
          location: "東京本社 4F",
          description: "大型モニターあり",
          updatedAt: date("2026-06-11T10:00:00+09:00"),
        }),
      );

      const foundMeetingRoom = await repository.findById("mr_001");

      expect(foundMeetingRoom?.name).toBe("会議室A 更新後");
      expect(foundMeetingRoom?.capacity).toBe(10);
      expect(foundMeetingRoom?.location).toBe("東京本社 4F");
      expect(foundMeetingRoom?.description).toBe("大型モニターあり");
      expect(foundMeetingRoom?.updatedAt).toEqual(
        date("2026-06-11T10:00:00+09:00"),
      );
    });

    it("[異常系] 存在しない id は null を返す", async () => {
      const foundMeetingRoom = await repository.findById("unknown");

      expect(foundMeetingRoom).toBeNull();
    });
  });

  describe("findByName", () => {
    it("[正常系] save した MeetingRoom を findByName で取得できる", async () => {
      await repository.save(createTestMeetingRoom());

      const foundMeetingRoom = await repository.findByName("会議室A");

      expect(foundMeetingRoom?.id).toBe("mr_001");
    });

    it("[異常系] 存在しない name は null を返す", async () => {
      const foundMeetingRoom = await repository.findByName("存在しない会議室");

      expect(foundMeetingRoom).toBeNull();
    });
  });

  describe("findAll", () => {
    it("[正常系] findAll で全件取得できる", async () => {
      await repository.save(createTestMeetingRoom({ id: "mr_001", name: "A" }));
      await repository.save(createTestMeetingRoom({ id: "mr_002", name: "B" }));

      const meetingRooms = await repository.findAll();

      expect(meetingRooms).toHaveLength(2);
      expect(meetingRooms.map((meetingRoom) => meetingRoom.id)).toEqual([
        "mr_001",
        "mr_002",
      ]);
    });

    it("[正常系] findAll で capacityGte の条件検索ができる", async () => {
      await repository.save(
        createTestMeetingRoom({
          id: "mr_001",
          name: "小会議室",
          capacity: 4,
        }),
      );
      await repository.save(
        createTestMeetingRoom({
          id: "mr_002",
          name: "大会議室",
          capacity: 12,
        }),
      );

      const meetingRooms = await repository.findAll({ capacityGte: 8 });

      expect(meetingRooms.map((meetingRoom) => meetingRoom.id)).toEqual([
        "mr_002",
      ]);
    });

    it("[正常系] findAll で location の条件検索ができる", async () => {
      await repository.save(
        createTestMeetingRoom({
          id: "mr_001",
          name: "東京会議室",
          location: "東京本社",
        }),
      );
      await repository.save(
        createTestMeetingRoom({
          id: "mr_002",
          name: "大阪会議室",
          location: "大阪支社",
        }),
      );

      const meetingRooms = await repository.findAll({ location: "東京本社" });

      expect(meetingRooms.map((meetingRoom) => meetingRoom.id)).toEqual([
        "mr_001",
      ]);
    });
  });
});
