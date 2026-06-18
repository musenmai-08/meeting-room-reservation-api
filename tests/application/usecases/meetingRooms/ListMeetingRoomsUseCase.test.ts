import { describe, expect, it } from "vitest";

import { ListMeetingRoomsUseCase } from "@application/usecases/meetingRooms/ListMeetingRoomsUseCase";
import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { InMemoryMeetingRoomRepository } from "@infrastructure/_repositories/InMemoryMeetingRoomRepository";

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

describe("ListMeetingRoomsUseCase", () => {
  it("[正常系] 会議室一覧を取得できる", async () => {
    const repository = new InMemoryMeetingRoomRepository();
    await repository.save(
      createTestMeetingRoom({ id: "mr_001", name: "会議室A" }),
    );
    await repository.save(
      createTestMeetingRoom({ id: "mr_002", name: "会議室B" }),
    );
    const useCase = new ListMeetingRoomsUseCase(repository);

    const output = await useCase.execute();

    expect(output.items).toHaveLength(2);
    expect(output.items.map((item) => item.id)).toEqual(["mr_001", "mr_002"]);
  });

  it("[正常系] capacityGte で絞り込める", async () => {
    const repository = new InMemoryMeetingRoomRepository();
    await repository.save(
      createTestMeetingRoom({ id: "mr_001", name: "会議室A", capacity: 4 }),
    );
    await repository.save(
      createTestMeetingRoom({ id: "mr_002", name: "会議室B", capacity: 8 }),
    );
    const useCase = new ListMeetingRoomsUseCase(repository);

    const output = await useCase.execute({ capacityGte: 6 });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("mr_002");
  });

  it("[正常系] location で絞り込める", async () => {
    const repository = new InMemoryMeetingRoomRepository();
    await repository.save(
      createTestMeetingRoom({
        id: "mr_001",
        name: "会議室A",
        location: "東京本社 3F",
      }),
    );
    await repository.save(
      createTestMeetingRoom({
        id: "mr_002",
        name: "会議室B",
        location: "大阪支社 2F",
      }),
    );
    const useCase = new ListMeetingRoomsUseCase(repository);

    const output = await useCase.execute({ location: "大阪支社 2F" });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("mr_002");
  });

  it("[正常系] UseCase の出力が一覧用 DTO の形になる", async () => {
    const repository = new InMemoryMeetingRoomRepository();
    await repository.save(createTestMeetingRoom());
    const useCase = new ListMeetingRoomsUseCase(repository);

    const output = await useCase.execute();

    expect(output).toEqual({
      items: [
        {
          id: "mr_001",
          name: "会議室A",
          capacity: 8,
          location: "東京本社 3F",
          description: "モニターあり",
        },
      ],
    });
  });
});
