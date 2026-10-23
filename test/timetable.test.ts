import timetable from "../src/utils/TimeTable.json";

import { describe, expect, it } from "vitest";

describe("時刻表の形式が正しいか検証します", () => {
  it("すべての停車バス停リストは長さが2以上である", () => {
    timetable.map((item) => {
      expect(item.stopList.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("出力された時刻JSONの時刻-1は異常値です", () => {
    timetable.map((item) => {
      expect(item.arriveHour).not.equal(-1);
      expect(item.arriveMinute).not.equal(-1);
      expect(item.leaveHour).not.equal(-1);
      expect(item.leaveMinute).not.equal(-1);
    });
  });

  it("出発時刻は到着時刻より後である必要があります",()=>{
    timetable.map(item=>{
      expect(item.arriveHour*60+item.arriveMinute).toBeGreaterThanOrEqual(item.leaveHour*60+item.leaveMinute)
    })
  })

  it("正しい値を持っている必要があります。",()=>{
    timetable.map(item=>{
      Object.keys(item).map(key=>{
        expect(item[key as keyof typeof item]).not.toBeUndefined()
        expect(item[key as keyof typeof item]).not.toBeNull()
      })
    })
  })

});

