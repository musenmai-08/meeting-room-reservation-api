import { describe, expect, it } from "vitest";

import { ListReservationsUseCase } from "@application/usecases/reservations/ListReservationsUseCase";
import { Reservation } from "@domain/entities/Reservation";
import { ReservationPeriod } from "@domain/valueObjects/ReservationPeriod";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";
import { InMemoryReservationRepository } from "@infrastructure/_repositories/InMemoryReservationRepository";

const date = (isoString: string): Date => new Date(isoString);

const createReservation = (
  overrides: Partial<Parameters<typeof Reservation.create>[0]> = {},
): Reservation =>
  Reservation.create({
    id: "res_001",
    resourceType: ResourceType.MeetingRoom,
    resourceId: "mr_001",
    userId: "user_001",
    period: ReservationPeriod.create(
      date("2026-06-11T10:00:00+09:00"),
      date("2026-06-11T11:00:00+09:00"),
    ),
    purpose: "定例ミーティング",
    status: ReservationStatus.Reserved,
    cancelledAt: null,
    createdAt: date("2026-06-10T10:00:00+09:00"),
    updatedAt: date("2026-06-10T10:00:00+09:00"),
    ...overrides,
  });

describe("ListReservationsUseCase", () => {
  it("[正常系] 予約一覧を取得できる", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation({ id: "res_001" }));
    await repository.save(createReservation({ id: "res_002" }));
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute();

    expect(output.items.map((item) => item.id)).toEqual(["res_001", "res_002"]);
  });

  it("[正常系] userId で絞り込める", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(
      createReservation({ id: "res_001", userId: "user_001" }),
    );
    await repository.save(
      createReservation({ id: "res_002", userId: "user_002" }),
    );
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute({ userId: "user_002" });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("res_002");
  });

  it("[正常系] resourceType で絞り込める", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation({ id: "res_001" }));
    await repository.save(
      createReservation({
        id: "res_002",
        resourceType: ResourceType.Equipment,
        resourceId: "eq_001",
      }),
    );
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute({
      resourceType: ResourceType.Equipment,
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("res_002");
  });

  it("[正常系] resourceId で絞り込める", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(
      createReservation({ id: "res_001", resourceId: "mr_001" }),
    );
    await repository.save(
      createReservation({ id: "res_002", resourceId: "mr_002" }),
    );
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute({ resourceId: "mr_002" });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("res_002");
  });

  it("[正常系] status で絞り込める", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation({ id: "res_001" }));
    await repository.save(
      createReservation({
        id: "res_002",
        status: ReservationStatus.Cancelled,
        cancelledAt: date("2026-06-10T12:00:00+09:00"),
      }),
    );
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute({
      status: ReservationStatus.Cancelled,
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("res_002");
  });

  it("[正常系] from と to で絞り込める", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(
      createReservation({
        id: "res_001",
        period: ReservationPeriod.create(
          date("2026-06-11T10:00:00+09:00"),
          date("2026-06-11T11:00:00+09:00"),
        ),
      }),
    );
    await repository.save(
      createReservation({
        id: "res_002",
        period: ReservationPeriod.create(
          date("2026-06-12T10:00:00+09:00"),
          date("2026-06-12T11:00:00+09:00"),
        ),
      }),
    );
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute({
      from: date("2026-06-12T00:00:00+09:00"),
      to: date("2026-06-12T23:59:59+09:00"),
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0]?.id).toBe("res_002");
  });

  it("[正常系] UseCase の出力が一覧用 DTO の形になる", async () => {
    const repository = new InMemoryReservationRepository();
    await repository.save(createReservation());
    const useCase = new ListReservationsUseCase(repository);

    const output = await useCase.execute();

    expect(output).toEqual({
      items: [
        {
          id: "res_001",
          resourceType: ResourceType.MeetingRoom,
          resourceId: "mr_001",
          userId: "user_001",
          startAt: date("2026-06-11T10:00:00+09:00"),
          endAt: date("2026-06-11T11:00:00+09:00"),
          purpose: "定例ミーティング",
          status: ReservationStatus.Reserved,
          cancelledAt: null,
        },
      ],
    });
  });
});
