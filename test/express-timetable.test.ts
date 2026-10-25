import * as v from "valibot";
import { describe, expect, it } from "vitest";

import regularJSON from "../src/utils/TimeTable.json";
import expressJSON from "../src/utils/ExpressTimetable.json";
import {
  expandExpressTimetable,
  findNextBuses,
  isAvailableOn,
  mergeTimetables,
  toDateKey,
} from "../src/utils/timeHandlers";
import {
  expressTimetableSchema,
  timetableSchema,
  type RegularTimetableEntry,
  type TimetableEntry,
} from "../src/utils/types";

type ExpressJSON = v.InferOutput<typeof expressTimetableSchema>;

const regularBus = (
  leaveHour: number,
  leaveMinute: number,
): RegularTimetableEntry => ({
  kind: "regular",
  id: `regular-${leaveHour}-${leaveMinute}`,
  day: "Weekday",
  station: "nishihachioji",
  isComingToHosei: true,
  leaveHour,
  leaveMinute,
  arriveHour: leaveHour,
  arriveMinute: leaveMinute + 20,
  stopList: [
    { hour: leaveHour, minute: leaveMinute, name: "西八王子駅南口" },
    { hour: leaveHour, minute: leaveMinute + 20, name: "法政大学" },
  ],
});

const expressGroup = (overrides: Partial<ExpressJSON[number]> = {}): ExpressJSON[number] => ({
  kind: "express",
  station: "nishihachioji",
  isComingToHosei: true,
  day: "Weekday",
  validFrom: "2026-04-07",
  validTo: "2026-04-10",
  departures: ["8:30"],
  ...overrides,
});

describe("ExpressTimetable.json の形式", () => {
  const data = v.parse(expressTimetableSchema, expressJSON);

  it("スキーマに一致する", () => {
    expect(data.length).toBeGreaterThan(0);
  });

  it("validFrom / validTo は YYYY-MM-DD で、validFrom <= validTo である", () => {
    data.forEach((group) => {
      expect(group.validFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (group.validTo) {
        expect(group.validTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(group.validFrom <= group.validTo).toBe(true);
      }
    });
  });

  it("時刻は 0:00〜23:59 の範囲にある", () => {
    expandExpressTimetable(data).forEach((bus) => {
      expect(bus.leaveHour).toBeGreaterThanOrEqual(0);
      expect(bus.leaveHour).toBeLessThan(24);
      expect(bus.leaveMinute).toBeGreaterThanOrEqual(0);
      expect(bus.leaveMinute).toBeLessThan(60);
    });
  });

  it("展開した便の id はすべて異なる", () => {
    const ids = expandExpressTimetable(data).map((bus) => bus.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("TimeTable.json のパース", () => {
  it("kind が無くても regular として読み込まれる", () => {
    const timetable = v.parse(timetableSchema, regularJSON);
    expect(timetable.every((bus) => bus.kind === "regular")).toBe(true);
  });
});

describe("expandExpressTimetable", () => {
  it("文字列の時刻はキャンパス行き、destination 付きはその行き先になる", () => {
    const [campus, gym] = expandExpressTimetable([
      expressGroup({ departures: ["8:38", { time: "8:45", destination: "gym" }] }),
    ]);
    expect(campus).toMatchObject({ leaveHour: 8, leaveMinute: 38, destination: "campus" });
    expect(gym).toMatchObject({ leaveHour: 8, leaveMinute: 45, destination: "gym" });
  });

  it("id は呼び出しのたびに同じになる", () => {
    const data = [expressGroup({ departures: ["8:38", "10:26"] })];
    expect(expandExpressTimetable(data).map((bus) => bus.id)).toEqual(
      expandExpressTimetable(data).map((bus) => bus.id),
    );
  });

  it("同じ時刻の便が複数あっても id が重複しない", () => {
    const ids = expandExpressTimetable([
      expressGroup({ departures: ["12:00", "12:00"] }),
    ]).map((bus) => bus.id);
    expect(ids).toEqual([
      "express-nishihachioji-to-hosei-Weekday-2026-04-07-1200",
      "express-nishihachioji-to-hosei-Weekday-2026-04-07-1200-2",
    ]);
  });
});

describe("mergeTimetables", () => {
  it("通常便と急行便を発車時刻順に並べる", () => {
    const merged = mergeTimetables({
      regular: [regularBus(9, 0), regularBus(8, 0)],
      express: [expressGroup({ departures: ["8:30"] })],
    });
    expect(merged.map((bus) => [bus.kind, bus.leaveHour, bus.leaveMinute])).toEqual([
      ["regular", 8, 0],
      ["express", 8, 30],
      ["regular", 9, 0],
    ]);
  });

  it("引数の配列を書き換えない", () => {
    const regular = [regularBus(9, 0), regularBus(8, 0)];
    mergeTimetables({ regular, express: [expressGroup()] });
    expect(regular.map((bus) => bus.leaveHour)).toEqual([9, 8]);
  });
});

describe("isAvailableOn", () => {
  const [express] = expandExpressTimetable([expressGroup()]);

  it("通常便は常に運行する", () => {
    expect(isAvailableOn({ entry: regularBus(8, 0), date: new Date(2020, 0, 1) })).toBe(true);
  });

  it("validFrom と validTo の当日を含む", () => {
    expect(isAvailableOn({ entry: express, date: new Date(2026, 3, 7, 0, 0) })).toBe(true);
    expect(isAvailableOn({ entry: express, date: new Date(2026, 3, 10, 23, 59) })).toBe(true);
  });

  it("期間外は運行しない", () => {
    expect(isAvailableOn({ entry: express, date: new Date(2026, 3, 6, 23, 59) })).toBe(false);
    expect(isAvailableOn({ entry: express, date: new Date(2026, 3, 11, 0, 0) })).toBe(false);
  });

  it("validTo が無ければ validFrom 以降ずっと運行する", () => {
    const [openEnded] = expandExpressTimetable([expressGroup({ validTo: undefined })]);
    expect(isAvailableOn({ entry: openEnded, date: new Date(2030, 0, 1) })).toBe(true);
  });

  it("toDateKey はローカル日付を YYYY-MM-DD で返す", () => {
    expect(toDateKey(new Date(2026, 3, 7, 23, 59))).toBe("2026-04-07");
  });
});

describe("findNextBuses と急行便", () => {
  // 2026-04-07(火)〜04-10(金)だけ 8:30 の急行便がある
  const buildTimetable = (): TimetableEntry[] =>
    mergeTimetables({
      regular: [regularBus(8, 0), regularBus(9, 0)],
      express: [expressGroup({ departures: ["8:30"] })],
    });

  const find = (currentDate: Date, length: number) =>
    findNextBuses({
      timetable: buildTimetable(),
      holidayData: {},
      currentDate,
      length,
      isComingToHosei: true,
      station: "nishihachioji",
    });

  it("期間内は通常便の間に急行便が入る", () => {
    const buses = find(new Date(2026, 3, 7, 7, 50), 3);
    expect(buses.map((bus) => bus.kind)).toEqual(["regular", "express", "regular"]);
    const express = buses[1];
    expect(express.kind === "express" && express.date).toEqual(new Date(2026, 3, 7, 8, 30));
  });

  it("期間前の日は急行便を返さない", () => {
    // 2026-04-06(月)
    const buses = find(new Date(2026, 3, 6, 7, 50), 2);
    expect(buses.map((bus) => [bus.kind, bus.leaveHour])).toEqual([
      ["regular", 8],
      ["regular", 9],
    ]);
  });

  it("翌日に繰り越したときも期間で判定する", () => {
    // 2026-04-10(金) 9:30 → 次は 04-13(月)。04-13 は期間外なので急行便は出ない
    const buses = find(new Date(2026, 3, 10, 9, 30), 2);
    expect(buses.map((bus) => [bus.kind, bus.date.getDate(), bus.leaveHour])).toEqual([
      ["regular", 13, 8],
      ["regular", 13, 9],
    ]);
  });

  it("過去方向の検索でも期間で判定する", () => {
    // 2026-04-07(火) 8:20 の直前は 04-07 8:00、その前は 04-06 9:00（急行便は 04-06 に無い）
    const buses = find(new Date(2026, 3, 7, 8, 20), -2);
    expect(buses.map((bus) => [bus.kind, bus.date.getDate(), bus.leaveHour])).toEqual([
      ["regular", 6, 9],
      ["regular", 7, 8],
    ]);
  });
});
