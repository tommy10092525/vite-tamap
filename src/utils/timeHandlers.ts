import type { Timetable, HolidayData } from "./types"

const dayIndices = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const equationOfTime = 9

function toMinutes({ hour, minutes }: { hour: number, minutes: number }) {
  return hour * 60 + minutes
}

function timeDifference({ nowInMinutes, busInMinutes }: { nowInMinutes: number, busInMinutes: number }) {
  return busInMinutes - nowInMinutes
}

// 日付が祝日かどうかを判定
function isHoliday({ date, holidayData }: { date: Date, holidayData: HolidayData }) {
  // 日本時間と標準時の差を足す。
  // 文字列としてみた際に日本の日付になるようにする。
  date.setHours(date.getHours() + equationOfTime)
  const formattedDate = date.toISOString().split('T')[0]
  if (!holidayData) {
    console.log("祝日データがpending状態です！！！")
    return false
  }
  return Object.prototype.hasOwnProperty.call(holidayData, formattedDate)
}

// 平日かどうかを判定
function isWeekday(day: string) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day)
}

// 次の曜日を取得する関数（祝日も「日曜日」として扱う）
function getNextDay({ currentDay, currentDate, holidayData }: { currentDay: string, currentDate: Date, holidayData: HolidayData }) {
  const nextDate = new Date(currentDate)
  nextDate.setDate(nextDate.getDate() + 1)
  if (isHoliday({
    date: nextDate,
    holidayData
  })) {
    return "Sunday" // 祝日を日曜日と扱う
  }
  const nextDayIndex = (dayIndices.indexOf(currentDay) + 1) % 7
  return dayIndices[nextDayIndex]
}

function getPreviousDay({ currentDay, currentDate, holidayData }: { currentDay: string, currentDate: Date, holidayData: HolidayData }) {
  const previousDate = new Date(currentDate)
  previousDate.setDate(previousDate.getDate() - 1)
  if (isHoliday({
    date: previousDate,
    holidayData
  })) {
    return "Sunday" // 祝日を日曜日と扱う
  }
  const previousDayIndex = (dayIndices.indexOf(currentDay) - 1 + 7) % 7
  return dayIndices[previousDayIndex]
}

// 次のバスを検索
function findNextBuses({
  timeTable, holidayData, currentDay, currentHour, currentMinutes, currentDate, length, isComingToHosei, station }: {
    timeTable: Timetable, holidayData: HolidayData, currentDay: string, currentHour: number, currentMinutes: number, currentDate: Date, length: number, isComingToHosei: boolean, station: string
  }) {
  const nowInMinutes = toMinutes({
    hour: currentHour,
    minutes: currentMinutes
  })
  const nextBuses = []
  // 現在の曜日のバスを取得
  let newTimeTable = timeTable.slice()
  newTimeTable = newTimeTable.filter(item => item.station === station && item.isComingToHosei === isComingToHosei)
  newTimeTable = newTimeTable.sort((a, b) => {
    if (a.leaveHour * 60 + a.leaveMinute > b.leaveHour * 60 + b.leaveMinute) {
      return 1
    } else {
      return -1
    }
  })
  if (length <= -1) {
    newTimeTable.reverse()
  }
  console.log("並び替えた時刻表", newTimeTable)
  let dayToCheck: string
  if (isHoliday({
    date: currentDate,
    holidayData
  })) {
    dayToCheck = "Sunday"
  } else {
    dayToCheck = currentDay
  }
  const dateToCheck = currentDate
  // バスが見つかるまで次の日に進む
  for (let i = 0; i < 7; i++) {
    const busesForDay = newTimeTable.slice().filter(bus =>
      bus.day === dayToCheck || (isWeekday(dayToCheck) && bus.day === "Weekday")
    )
    for (const bus of busesForDay) {
      const busLeaveTime = toMinutes({
        hour: bus.leaveHour,
        minutes: bus.leaveMinute
      })
      if (length >= 1) {
        if (i > 0 || timeDifference({
          nowInMinutes,
          busInMinutes: busLeaveTime
        }) >= 0) {
          nextBuses.push(bus)
        }
      } else {
        if (i > 0 || timeDifference({
          nowInMinutes,
          busInMinutes: busLeaveTime
        }) < 0) {
          nextBuses.push(bus)
        }
      }
      if (nextBuses.length >= Math.abs(length)) {
        if (length >= 0) {
          return nextBuses
        } else {
          return nextBuses.reverse()
        }
      } // 2本のバスを見つけたら返す
    }
    if (length >= 1) {
      dayToCheck = getNextDay({
        currentDay: dayToCheck,
        currentDate: dateToCheck,
        holidayData
      })
      dateToCheck.setDate(dateToCheck.getDate() + 1)
    } else {
      dayToCheck = getPreviousDay({
        currentDay: dayToCheck,
        currentDate: dateToCheck,
        holidayData
      })
      dateToCheck.setDate(dateToCheck.getDate() - 1)
    }
  }
  return nextBuses
}

// `hh:mm` を分単位に変換する関数
function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// 分単位を `hh:mm` に戻す関数
function minutesToTime(minutes: number) {
  const hours = String(Math.floor(minutes / 60))
  const mins = String(minutes % 60).padStart(2, "0")
  return `${hours}:${mins}`
}

export {
  toMinutes,
  timeDifference,
  isHoliday,
  isWeekday,
  getNextDay,
  findNextBuses,
  timeToMinutes,
  minutesToTime,
  dayIndices,
  equationOfTime
}