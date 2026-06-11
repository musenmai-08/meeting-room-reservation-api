import { describe, expect, it } from "vitest";

import { MeetingRoom } from "@domain/entities/MeetingRoom";
import { InvalidMeetingRoomError } from "@domain/errors/MeetingRoomErrors";

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

describe("MeetingRoom", () => {
  describe("create", () => {
    it("[正常系] 有効な値の場合、MeetingRoom を生成できる", () => {
      const meetingRoom = createTestMeetingRoom();

      expect(meetingRoom.id).toBe("mr_001");
      expect(meetingRoom.name).toBe("会議室A");
      expect(meetingRoom.capacity).toBe(8);
      expect(meetingRoom.location).toBe("東京本社 3F");
      expect(meetingRoom.description).toBe("モニターあり");
    });

    it("[正常系] name が 1 文字の場合、MeetingRoom を生成できる", () => {
      const meetingRoom = createTestMeetingRoom({ name: "A" });

      expect(meetingRoom.name).toBe("A");
    });

    it("[正常系] name が 100 文字の場合、MeetingRoom を生成できる", () => {
      const name = "A".repeat(100);

      const meetingRoom = createTestMeetingRoom({ name });

      expect(meetingRoom.name).toBe(name);
    });

    it("[正常系] capacity が 1 の場合、MeetingRoom を生成できる", () => {
      const meetingRoom = createTestMeetingRoom({ capacity: 1 });

      expect(meetingRoom.capacity).toBe(1);
    });

    it("[正常系] name の前後に空白がある場合、trim して保持する", () => {
      const meetingRoom = createTestMeetingRoom({ name: "  会議室A  " });

      expect(meetingRoom.name).toBe("会議室A");
    });

    it("[正常系] Date の getter は clone を返す", () => {
      const meetingRoom = createTestMeetingRoom();

      const createdAt = meetingRoom.createdAt;
      const updatedAt = meetingRoom.updatedAt;
      createdAt.setHours(20);
      updatedAt.setHours(20);

      expect(meetingRoom.createdAt).toEqual(date("2026-06-10T10:00:00+09:00"));
      expect(meetingRoom.updatedAt).toEqual(date("2026-06-10T10:00:00+09:00"));
    });

    it("[異常系] id が空の場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ id: " " })).toThrow(
        InvalidMeetingRoomError,
      );
    });

    it("[異常系] name が空の場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ name: " " })).toThrow(
        InvalidMeetingRoomError,
      );
    });

    it("[異常系] name が 101 文字の場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ name: "A".repeat(101) })).toThrow(
        InvalidMeetingRoomError,
      );
    });

    it("[異常系] capacity が 0 の場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ capacity: 0 })).toThrow(
        InvalidMeetingRoomError,
      );
    });

    it("[異常系] capacity が整数でない場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ capacity: 1.5 })).toThrow(
        InvalidMeetingRoomError,
      );
    });

    it("[異常系] createdAt が不正な Date の場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ createdAt: date("invalid") })).toThrow(
        InvalidMeetingRoomError,
      );
    });

    it("[異常系] updatedAt が不正な Date の場合、エラーになる", () => {
      expect(() => createTestMeetingRoom({ updatedAt: date("invalid") })).toThrow(
        InvalidMeetingRoomError,
      );
    });
  });

  describe("equals", () => {
    it("[正常系] id が同じ場合、同じ Entity として扱う", () => {
      const meetingRoom = createTestMeetingRoom({ id: "mr_001" });
      const otherMeetingRoom = createTestMeetingRoom({
        id: "mr_001",
        name: "別の会議室",
      });

      expect(meetingRoom.equals(otherMeetingRoom)).toBe(true);
    });

    it("[正常系] id が異なる場合、別の Entity として扱う", () => {
      const meetingRoom = createTestMeetingRoom({ id: "mr_001" });
      const otherMeetingRoom = createTestMeetingRoom({ id: "mr_002" });

      expect(meetingRoom.equals(otherMeetingRoom)).toBe(false);
    });
  });
});
