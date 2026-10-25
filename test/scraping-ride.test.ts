import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";

import {
  buildTimetableRows,
  extractRide,
  parseKeioBusStopList,
  stopNames,
} from "../scraping";

// 西５６ 西八王子駅南口 6:25発 → めじろ台駅 6:36 → 法政大学 6:52（めじろ台駅の停車時刻表から開いたページ）
const mejirodaiHtml = fs.readFileSync(
  path.resolve(__dirname, "../html/mejiro_busstops.html"),
  "utf-8",
);

// 法政大学発の便（下り）のバス停リスト
const hoseiToNishihachioji = [
  { hour: 15, minute: 0, name: "法政大学" },
  { hour: 15, minute: 10, name: "めじろ台駅" },
  { hour: 15, minute: 12, name: "めじろ台一丁目" },
  { hour: 15, minute: 20, name: "西八王子駅南口" },
];
const hoseiToMejirodaiOnly = [
  { hour: 16, minute: 0, name: "法政大学" },
  { hour: 16, minute: 10, name: "めじろ台駅" },
];

describe("parseKeioBusStopList", () => {
  const stopList = parseKeioBusStopList(mejirodaiHtml);

  it("すべてのバス停を順番どおりに取り出す", () => {
    expect(stopList).toHaveLength(18);
    expect(stopList[0]).toEqual({ hour: 6, minute: 25, name: "西八王子駅南口" });
    expect(stopList[6]).toEqual({ hour: 6, minute: 36, name: "めじろ台駅" });
    expect(stopList.at(-1)).toEqual({ hour: 6, minute: 52, name: "法政大学" });
  });
});

describe("extractRide", () => {
  const stopList = parseKeioBusStopList(mejirodaiHtml);

  it("始発でない駅から乗る場合は、その駅の時刻を出発時刻にする", () => {
    const ride = extractRide(stopList, stopNames.mejirodai, stopNames.hosei);
    expect(ride).toMatchObject({ leaveHour: 6, leaveMinute: 36, arriveHour: 6, arriveMinute: 52 });
    expect(ride?.stopList[0].name).toBe("めじろ台駅");
    expect(ride?.stopList.at(-1)?.name).toBe("法政大学");
    expect(ride?.stopList).toHaveLength(12);
  });

  it("始発駅から乗る場合はバス停リスト全体になる", () => {
    const ride = extractRide(stopList, stopNames.nishihachioji, stopNames.hosei);
    expect(ride).toMatchObject({ leaveHour: 6, leaveMinute: 25, arriveHour: 6, arriveMinute: 52 });
    expect(ride?.stopList).toEqual(stopList);
  });

  it("終点でない駅で降りる場合は、その駅の時刻を到着時刻にする", () => {
    const ride = extractRide(hoseiToNishihachioji, stopNames.hosei, stopNames.mejirodai);
    expect(ride).toMatchObject({ leaveHour: 15, leaveMinute: 0, arriveHour: 15, arriveMinute: 10 });
    expect(ride?.stopList.map((stop) => stop.name)).toEqual(["法政大学", "めじろ台駅"]);
  });

  it("区間を通らない便は null を返す", () => {
    expect(extractRide(hoseiToMejirodaiOnly, stopNames.hosei, stopNames.nishihachioji)).toBeNull();
    expect(extractRide(stopList, stopNames.aihara, stopNames.hosei)).toBeNull();
  });

  it("逆向きの区間は null を返す", () => {
    expect(extractRide(stopList, stopNames.hosei, stopNames.mejirodai)).toBeNull();
  });
});

describe("buildTimetableRows", () => {
  it("上りは駅ごとにその駅から乗る行を作る", () => {
    const rows = buildTimetableRows({
      stopList: parseKeioBusStopList(mejirodaiHtml),
      day: "Weekday",
      stations: ["nishihachioji", "mejirodai"],
      isComingToHosei: true,
    });
    expect(
      rows.map((row) => [row.station, row.leaveHour, row.leaveMinute, row.arriveHour, row.arriveMinute]),
    ).toEqual([
      ["nishihachioji", 6, 25, 6, 52],
      ["mejirodai", 6, 36, 6, 52],
    ]);
    expect(rows.every((row) => row.isComingToHosei && row.day === "Weekday")).toBe(true);
  });

  it("下りは1便から駅ごとに別の到着時刻の行を作る", () => {
    const rows = buildTimetableRows({
      stopList: hoseiToNishihachioji,
      day: "Weekday",
      stations: ["nishihachioji", "mejirodai"],
      isComingToHosei: false,
    });
    expect(rows.map((row) => [row.station, row.arriveHour, row.arriveMinute])).toEqual([
      ["nishihachioji", 15, 20],
      ["mejirodai", 15, 10],
    ]);
  });

  it("めじろ台駅止まりの便は西八王子の行を作らない", () => {
    const rows = buildTimetableRows({
      stopList: hoseiToMejirodaiOnly,
      day: "Weekday",
      stations: ["nishihachioji", "mejirodai"],
      isComingToHosei: false,
    });
    expect(rows.map((row) => row.station)).toEqual(["mejirodai"]);
  });
});

describe("scraping.ts の読み込み", () => {
  it("import しただけではスクレイピングしない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    await import("../scraping");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
