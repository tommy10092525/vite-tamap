import { expect, test } from "vitest"

import timetable from "../../src/utils/Timetable.json"
import holidayData from "../../src/utils/Holidays.json"
import {
  binarySearch,
  findNextBuses,
  getDateString,
  isHoliday as getHolidayName,
  getNextDay,
  getPreviousDay,
  getTimeString,
  isWeekday,
  msToTime,
  timeDifference,
  timeToms,
  toms,
} from "../../src/utils/timeHandlers"

import { timetableSchema } from "../../src/utils/types"


test("tom", () => {
  expect(
    toms({
      h: 1,
      ms: 30
    })).toBe(90)
})

test("binarySearch", () => {
  const result = binarySearch({
    data: [1, 1, 2, 3, 4, 5, 6],
    cmp: (a: number) => {
      return a >= 0
    }
  })
  expect(result).toBe(0)
})

test("timeDiffrence", () => {
  expect(timeDifference({
    busInms: 120,
    nowInms: 100
  })).toBe(20)
})

test("isHoliday", () => {
  expect(
    !!getHolidayName({ date: new Date("2026/1/1"), holidayData })
  ).toBe(true)
  expect(
    !!getHolidayName({ date: new Date("2026/12/31"), holidayData })
  ).toBe(false)
})

test("isWeekday", () => {
  expect(isWeekday("Sunday")).toBe(false)
  expect(isWeekday("Monday")).toBe(true)
})

test("getNextDay", () => {
  let date = new Date("2026/2/6")
  expect(getNextDay({
    currentDate: date,
    holidayData
  })).toBe("Saturday")

  // 1/1は元日なので祝日判定
  date = new Date("2025/12/31")
  expect(getNextDay({
    currentDate: date,
    holidayData
  })).toBe("Sunday")
})

test("getPreviousDay", () => {
  let date = new Date("2026/2/6")
  expect(getPreviousDay({
    currentDate: date,
    holidayData
  })).toBe("Thursday")

  // 2/11は建国記念日なので祝日判定
  date = new Date("2026/2/12")
  expect(getPreviousDay({
    currentDate: date,
    holidayData
  })).toBe("Sunday")

  // 1/11は元日なので祝日判定
  date = new Date("2026/1/2")
  expect(getPreviousDay({
    currentDate: date,
    holidayData
  })).toBe("Sunday")
})

test("timeTom", () => {
  expect(timeToms("1:1")).toBe(61)
  expect(timeToms("10:1")).toBe(601)
})

test("mToTime", () => {
  expect(msToTime(61)).toBe("1:01")
  expect(msToTime(601)).toBe("10:01")
})

test("getString", () => {
  expect(getDateString(new Date("2025/1/1 23:59:59"))).toBe("2025/01/01")
  expect(getTimeString(new Date("2025/1/1 23:59:59"))).toBe("23:59:59")
})
test("バス検索ロジック　26年2月7日（土曜日）早朝　西八王子→法政", () => {
  const date = new Date("2026/2/7　0:00")
  const result = findNextBuses({
    currentDate: date,
    holidayData,
    isComingToHosei: true,
    length: 3,
    station: "nishihachioji",
    timetable: timetableSchema.parse(timetable)
  })[0]
  expect(`${result.leaveh}:${result.leavem}`).toBe("6:5")
  expect(`${result.arriveh}:${result.arrivem}`).toBe("6:26")
})

test("バス検索ロジック　26年2月7日（土曜日）早朝　めじろ台→法政", () => {
  const date = new Date("2026/2/7 0:00")
  const result = findNextBuses({
    currentDate: date,
    holidayData,
    isComingToHosei: true,
    length: 3,
    station: "mejirodai",
    timetable: timetableSchema.parse(timetable)
  })[0]
  expect(`${result.leaveh}:${result.leavem}`).toBe("6:15")
  expect(`${result.arriveh}:${result.arrivem}`).toBe("6:26")
})

test("バス検索ロジック　26年2月7日（土曜日）早朝　法政→めじろ台", () => {
  const date = new Date("2026/2/7 0:00")
  const result = findNextBuses({
    currentDate: date,
    holidayData,
    isComingToHosei: false,
    length: 3,
    station: "mejirodai",
    timetable: timetableSchema.parse(timetable)
  })[0]
  expect(`${result.leaveh}:${result.leavem}`).toBe("6:31")
  expect(`${result.arriveh}:${result.arrivem}`).toBe("6:45")
})

test("バス検索ロジック　26年2月7日（土曜日）早朝　相原→法政", () => {
  const date = new Date("2026/2/7 0:00")
  const result = findNextBuses({
    currentDate: date,
    holidayData,
    isComingToHosei: true,
    length: 3,
    station: "aihara",
    timetable: timetableSchema.parse(timetable)
  })[0]
  expect(`${result.leaveh}:${result.leavem}`).toBe("6:27")
  expect(`${result.arriveh}:${result.arrivem}`).toBe("6:39")
})


test("バス検索ロジック　26年2月7日（土曜日）早朝　法政→相原", () => {
  const date = new Date("2026/2/7 0:00")
  const result = findNextBuses({
    currentDate: date,
    holidayData,
    isComingToHosei: false,
    length: 3,
    station: "aihara",
    timetable: timetableSchema.parse(timetable)
  })[0]
  expect(`${result.leaveh}:${result.leavem}`).toBe("6:10")
  expect(`${result.arriveh}:${result.arrivem}`).toBe("6:21")
})

