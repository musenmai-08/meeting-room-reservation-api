import { describe, expect, it } from "vitest";

import { MeetingRoomAlreadyExistsError } from "@application/errors/MeetingRoomApplicationErrors";
import { type Clock } from "@application/services/Clock";
import { type IdGenerator } from "@application/services/IdGenerator";
import { CreateMeetingRoomUseCase } from "@application/usecases/meetingRooms/CreateMeetingRoomUseCase";
import { InMemoryMeetingRoomRepository } from "@infrastructure/_repositories/InMemoryMeetingRoomRepository";

class FixedIdGenerator implements IdGenerator {
  public constructor(private readonly id: string) {}

  public generate(): string {
    return this.id;
  }
}

class FixedClock implements Clock {
  public constructor(private readonly fixedNow: Date) {}

  public now(): Date {
    return this.fixedNow;
  }
}

const date = (isoString: string): Date => new Date(isoString);

const createUseCase = (
  options: {
    id?: string;
    now?: Date;
    repository?: InMemoryMeetingRoomRepository;
  } = {},
): {
  useCase: CreateMeetingRoomUseCase;
  repository: InMemoryMeetingRoomRepository;
} => {
  const repository = options.repository ?? new InMemoryMeetingRoomRepository();
  const useCase = new CreateMeetingRoomUseCase(
    repository,
    new FixedIdGenerator(options.id ?? "mr_001"),
    new FixedClock(options.now ?? date("2026-06-10T10:00:00+09:00")),
  );

  return { useCase, repository };
};

describe("CreateMeetingRoomUseCase", () => {
  it("[正常系] 同名の会議室が存在しない場合、会議室を作成できる", async () => {
    const { useCase } = createUseCase();

    const output = await useCase.execute({
      name: "会議室A",
      capacity: 8,
      location: "東京本社 3F",
      description: "モニターあり",
    });

    expect(output).toEqual({
      id: "mr_001",
      name: "会議室A",
      capacity: 8,
      location: "東京本社 3F",
      description: "モニターあり",
      createdAt: date("2026-06-10T10:00:00+09:00"),
      updatedAt: date("2026-06-10T10:00:00+09:00"),
    });
  });

  it("[異常系] 同名の会議室が存在する場合、作成に失敗する", async () => {
    const repository = new InMemoryMeetingRoomRepository();
    const { useCase: firstUseCase } = createUseCase({
      id: "mr_001",
      repository,
    });
    const { useCase: secondUseCase } = createUseCase({
      id: "mr_002",
      repository,
    });
    await firstUseCase.execute({
      name: "会議室A",
      capacity: 8,
    });

    await expect(
      secondUseCase.execute({
        name: "会議室A",
        capacity: 10,
      }),
    ).rejects.toThrow(MeetingRoomAlreadyExistsError);
  });

  it("[正常系] 作成時に IdGenerator の ID を使う", async () => {
    const { useCase } = createUseCase({ id: "mr_custom" });

    const output = await useCase.execute({
      name: "会議室A",
      capacity: 8,
    });

    expect(output.id).toBe("mr_custom");
  });

  it("[正常系] 作成時に Clock の現在日時を createdAt と updatedAt に使う", async () => {
    const now = date("2026-06-10T12:34:56+09:00");
    const { useCase } = createUseCase({ now });

    const output = await useCase.execute({
      name: "会議室A",
      capacity: 8,
    });

    expect(output.createdAt).toEqual(now);
    expect(output.updatedAt).toEqual(now);
  });

  it("[正常系] 作成した会議室を Repository に保存する", async () => {
    const { useCase, repository } = createUseCase({ id: "mr_saved" });

    await useCase.execute({
      name: "会議室A",
      capacity: 8,
    });

    const savedMeetingRoom = await repository.findById("mr_saved");

    expect(savedMeetingRoom?.id).toBe("mr_saved");
    expect(savedMeetingRoom?.name).toBe("会議室A");
    expect(savedMeetingRoom?.capacity).toBe(8);
  });
});
