import * as v from "valibot";

import {
  ekitanSchema,
  expressTimetableSchema,
  holidayDataSchema,
  stationSchema,
  type Bus,
  type ExpressTimetableEntry,
  type RegularBus,
  type RegularTimetableEntry,
  type TimetableEntry,
  type TrainWithDate,
} from "./types";

const dayIndices = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const equationOfTime = 9;

export function timeToMinutes({
  hour,
  minute,
}: {
  hour: number;
  minute: number;
}) {
  return hour * 60 + minute;
}

export function timeDifference({
  nowInMinutes: nowInMinutes,
  busInMinutes: busInms,
}: {
  nowInMinutes: number;
  busInMinutes: number;
}) {
  return busInms - nowInMinutes;
}

// 日付が祝日かどうかを判定
export function isHoliday({
  date,
  holidayData,
}: {
  date: Date;
  holidayData: v.InferOutput<typeof holidayDataSchema>;
}) {
  const newDate = structuredClone(date);
  // 日本時間と標準時の差を足す。
  // 文字列としてみた際に日本の日付になるようにする。
  newDate.setHours(newDate.getHours() + equationOfTime);
  const formattedDate = newDate.toISOString().split("T")[0];
  if (!holidayData) {
    throw new Error("Holiday data is not provided");
  }
  return holidayData[formattedDate];
}

// 平日かどうかを判定
export function isWeekday(day: string) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day);
}

// 次の曜日を取得する関数（祝日も「日曜日」として扱う）
export function getNextDay({
  currentDate,
  holidayData,
}: {
  currentDate: Date;
  holidayData: v.InferOutput<typeof holidayDataSchema>;
}) {
  const nextDate = new Date(currentDate);
  const currentDay = dayIndices[currentDate.getDay()];
  nextDate.setDate(nextDate.getDate() + 1);
  if (
    isHoliday({
      date: nextDate,
      holidayData,
    })
  ) {
    return "Sunday"; // 祝日を日曜日と扱う
  }
  const nextDayIndex = (dayIndices.indexOf(currentDay) + 1) % 7;
  return dayIndices[nextDayIndex];
}

export function getPreviousDay({
  currentDate,
  holidayData,
}: {
  currentDate: Date;
  holidayData: v.InferOutput<typeof holidayDataSchema>;
}) {
  const previousDate = new Date(currentDate);
  const currentDay = dayIndices[currentDate.getDay()];
  previousDate.setDate(previousDate.getDate() - 1);
  if (
    isHoliday({
      date: previousDate,
      holidayData,
    })
  ) {
    return "Sunday"; // 祝日を日曜日と扱う
  }
  const previousDayIndex = (dayIndices.indexOf(currentDay) - 1 + 7) % 7;
  return dayIndices[previousDayIndex];
}

// 現在の曜日のバスを取得
export const filterByConditions = ({
  timetable,
  station,
  isComingToHosei,
}: {
  timetable: TimetableEntry[];
  station: v.InferOutput<typeof stationSchema>;
  isComingToHosei: boolean;
}) => {
  const newTimetable = timetable
    .slice()
    .filter(
      (item) =>
        item.station === station && item.isComingToHosei === isComingToHosei,
    );
  return newTimetable;
};

// dateの時刻と秒を変更する
export const setHoursAndMinutes = ({
  date,
  h: hour,
  m: minute,
}: {
  date: Date;
  h: number;
  m: number;
}) => {
  const updatedDate = new Date(date);
  updatedDate.setHours(hour, minute);
  return updatedDate;
};

export const getDateAddedBus = ({
  dateToCheck,
  bus,
}: {
  dateToCheck: Date;
  bus: TimetableEntry;
}): Bus => {
  if (!bus) {
    throw "引数のbusがundefined"
  }
  const newDate = setHoursAndMinutes({
    date: dateToCheck,
    h: bus.leaveHour,
    m: bus.leaveMinute,
  });
  // 急行・直行便は経由バス停の情報がないので日付だけ加える
  if (bus.kind !== "regular") {
    return { date: newDate, ...bus };
  }
  const newBus: Omit<RegularBus, "date"> = {
    ...bus,
    stopList: bus.stopList.map((stop) => {
      // stListのそれぞれのオブジェクトについて，
      // mapのコールバック関数内でdateプロパティを新しく設定する
      const stopDate = setHoursAndMinutes({
        date: newDate,
        h: stop.hour,
        m: stop.minute,
      });
      // 電車の時刻を表示するためにtimetable.jsonでは時と分のみが設定されているところに日付の情報を加えて，
      // 年月日時刻の情報を生成する
      return {
        date: stopDate,
        hour: stopDate.getHours(),
        minute: stopDate.getMinutes(),
        name: stop.name,
      };
    }),
  };
  return { date: newDate, ...newBus };
};

// 次のバスを検索
// timetableは出発時刻順にソート済みであること（mergeTimetablesの戻り値）
export function findNextBuses({
  timetable,
  holidayData,
  currentDate,
  length,
  isComingToHosei,
  station,
}: {
  timetable: TimetableEntry[];
  holidayData: v.InferOutput<typeof holidayDataSchema>;
  currentDate: Date;
  length: number;
  isComingToHosei: boolean;
  station: v.InferOutput<typeof stationSchema>;
}) {
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentDay = dayIndices[currentDate.getDay()];
  const nowInMinutes = timeToMinutes({
    hour: currentHour,
    minute: currentMinutes,
  });
  const returnBuses: Bus[] = [];
  // 現在の曜日のバスを取得

  const newTimetable:typeof timetable = filterByConditions({
    timetable,
    isComingToHosei,
    station,
  });

  if (length <= -1) {
    newTimetable.reverse();
  }

  // forループを回してdayToCheckを変えていって条件に合致するバスを検索する
  let dayToCheck = isHoliday({
    date: currentDate,
    holidayData,
  })
    ? "Sunday"
    : currentDay;

  const dateToCheck = structuredClone(currentDate);
  // バスが見つかるまで次の日に進む
  for (let i = 0; i < 7; i++) {

    // ループですべての曜日について順番に検証し，適切なバスが存在するかどうか検証する。
    // 特定の曜日の時刻だけ選択
    const busesForDay = newTimetable
      .slice()
      .filter(
        (bus) =>{
          const condition=bus.day === dayToCheck ||(isWeekday(dayToCheck) && bus.day === "Weekday")
          return condition && isAvailableOn({ entry: bus, date: dateToCheck })
        });
    let m = -1;
    if (length >= 1) {
      m = binarySearch({
        data: busesForDay,
        cmpCallBackFn: (bus: {
          leaveHour: number;
          leaveMinute: number;
        }) => {
          const busLeaveTime = timeToMinutes({
            hour: bus.leaveHour,
            minute: bus.leaveMinute,
          });
          // console.log({busesForDay})
          return (
            i > 0 ||
            timeDifference({
              nowInMinutes,
              busInMinutes: busLeaveTime,
            }) >= 0
          );
        },
      });
    } else {
      m = binarySearch({
        data: busesForDay,
        cmpCallBackFn: (bus: {
          leaveHour: number;
          leaveMinute: number;
        }) => {
          const busLeaveTime = timeToMinutes({
            hour: bus.leaveHour,
            minute: bus.leaveMinute,
          });
          return (
            i > 0 ||
            timeDifference({
              nowInMinutes,
              busInMinutes: busLeaveTime,
            }) < 0
          );
        },
      });
    }

    for (let mm = m; mm < busesForDay.length && mm !== -1; mm++) {
      returnBuses.push(getDateAddedBus({ bus: busesForDay[mm], dateToCheck }))
      if (returnBuses.length >= Math.abs(length)) {
        return length > 0 ? returnBuses : returnBuses.reverse()
      }
    }


    if (length >= 1) {
      // lengthが1以上の場合曜日を1進める
      dayToCheck = getNextDay({
        currentDate: dateToCheck,
        holidayData,
      });
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    } else {
      // lengthが1以上の場合曜日を1戻す
      dayToCheck = getPreviousDay({
        currentDate: dateToCheck,
        holidayData,
      });
      dateToCheck.setDate(dateToCheck.getDate() - 1);
    }
  }
  return returnBuses;
}

// `hh:mm` を分単位に変換する関数
export function timeToMinute(time: string) {
  const [hs, ms] = time.split(":").map(Number);
  return hs * 60 + ms;
}

// 分単位を `hh:mm` に戻す関数
export function msToTime(ms: number) {
  const hs = String(Math.floor(ms / 60));
  const mins = String(ms % 60).padStart(2, "0");
  return `${hs}:${mins}`;
}

// 発車までの残り時間を分単位で返す。nowは秒以下を切り捨てて比べる
export function minutesUntil({ now, date }: { now: Date; date: Date }) {
  const nowMinute = Math.floor(now.getTime() / 60000);
  const dateMinute = Math.floor(date.getTime() / 60000);
  return dateMinute - nowMinute;
}

// 「あと○分」の表示用文字列。1分以内は「まもなく」、60分以上は時間も付ける
export function countdownLabel(minutes: number) {
  if (minutes <= 1) {
    return "まもなく";
  }
  if (minutes < 60) {
    return `あと${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `あと${hours}時間` : `あと${hours}時間${rest}分`;
}

export function getDateString(now: Date) {
  return `${now.getFullYear().toString().padStart(4, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")}`;
}

export function getTimeString(now: Date) {
  return `${now.getHours().toString()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

export const binarySearch = <T>({
  data,
  cmpCallBackFn: cmpCallbackFn,
}: {
  data: T[];
  cmpCallBackFn: (a: T) => boolean;
}) => {
  if (data.length === 0) {
    return -1;
  }
  let left = 0;
  let right = data.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (cmpCallbackFn(data[mid])) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  return left;
};

export function findFutureTrains({
  ekitanData,
  station,
  holidayData,
  date,
}: {
  ekitanData: v.InferOutput<typeof ekitanSchema>;
  station: string;
  holidayData: v.InferOutput<typeof holidayDataSchema>;
  date: Date;
}) {
  const currenth = date.getHours();
  const currentms = date.getMinutes();
  let currentDay = isHoliday({ date, holidayData })
    ? "Sunday"
    : dayIndices[date.getDay()];
  const nextTrains: TrainWithDate[] = [];
  const currentDate = date;
  for (let i = 0; i < 7; i++) {
    ekitanData
      .filter(
        (item) =>
          item.station === station &&
          (item.day === currentDay ||
            (isWeekday(currentDay) && item.day === "Weekday")),
      )
      .sort((a, b) => {
        return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
      })
      .map((item) => {
        const itemTime = item.hour * 60 + item.minute;
        const nowTime = currenth * 60 + currentms;
        if (itemTime >= nowTime || i > 0) {
          nextTrains.push({ date: currentDate, ...item });
        }
      });
    currentDay = getNextDay({
      currentDate: date,
      holidayData,
    });
    if (nextTrains.length >= 15) {
      break;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return [...nextTrains.slice(0, 15)];
}

export function findPastTrains({
  ekitanData,
  station,
  holidayData,
  date,
}: {
  ekitanData: v.InferOutput<typeof ekitanSchema>;
  station: string;
  holidayData: v.InferOutput<typeof holidayDataSchema>;
  date: Date;
}) {
  const currenth = date.getHours();
  const currentms = date.getMinutes();
  let currentDay = isHoliday({ date, holidayData })
    ? "Sunday"
    : dayIndices[date.getDay()];
  const pastTrains: TrainWithDate[] = [];
  const currentDate = date;
  for (let i = 0; i < 7; i++) {
    ekitanData
      .filter(
        (item) =>
          item.station === station &&
          (item.day === currentDay ||
            (isWeekday(currentDay) && item.day === "Weekday")),
      )
      .sort((a, b) => {
        return b.hour * 60 + b.minute - (a.hour * 60 + a.minute); // 降順
      })
      .map((item) => {
        const itemTime = item.hour * 60 + item.minute;
        const nowTime = currenth * 60 + currentms;
        if (itemTime < nowTime || i > 0) {
          pastTrains.push({ date: currentDate, ...item });
        }
      });
    currentDay = getPreviousDay({
      currentDate: date,
      holidayData,
    });
    if (pastTrains.length >= 15) {
      break;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return [...pastTrains.slice(0, 1)];
}

// dateのローカル日付を"YYYY-MM-DD"にする（validFrom/validToとの比較用）
export function toDateKey(date: Date) {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

// その日に運行する便かどうか。通常便は期間の指定がないので常にtrue
export function isAvailableOn({
  entry,
  date,
}: {
  entry: TimetableEntry;
  date: Date;
}) {
  if (entry.kind === "regular") {
    return true;
  }
  const dateKey = toDateKey(date);
  return (
    entry.validFrom <= dateKey &&
    (typeof entry.validTo === "undefined" || dateKey <= entry.validTo)
  );
}

// ExpressTimetable.jsonを時刻表の1便ずつに展開する。
// idは内容から決まるので、読み込みのたびに変わらない。
export function expandExpressTimetable(
  expressTimetable: v.InferOutput<typeof expressTimetableSchema>,
): ExpressTimetableEntry[] {
  const entries: ExpressTimetableEntry[] = [];
  const idCounts = new Map<string, number>();
  expressTimetable.forEach((group) => {
    group.departures.forEach((departure) => {
      const { time, destination } =
        typeof departure === "string"
          ? { time: departure, destination: "campus" as const }
          : departure;
      const [leaveHour, leaveMinute] = time.split(":").map(Number);
      const baseId = [
        group.kind,
        group.station,
        group.isComingToHosei ? "to-hosei" : "from-hosei",
        group.day,
        group.validFrom,
        `${leaveHour.toString().padStart(2, "0")}${leaveMinute.toString().padStart(2, "0")}`,
      ].join("-");
      // 同じ時刻に複数便ある場合は連番をつける
      const count = (idCounts.get(baseId) ?? 0) + 1;
      idCounts.set(baseId, count);
      entries.push({
        id: count === 1 ? baseId : `${baseId}-${count}`,
        kind: group.kind,
        destination,
        day: group.day,
        station: group.station,
        isComingToHosei: group.isComingToHosei,
        leaveHour,
        leaveMinute,
        validFrom: group.validFrom,
        validTo: group.validTo,
      });
    });
  });
  return entries;
}

// 通常便と急行・直行便を1つの時刻表にまとめる。引数は書き換えない
export function mergeTimetables({
  regular,
  express,
}: {
  regular: RegularTimetableEntry[];
  express: v.InferOutput<typeof expressTimetableSchema>;
}): TimetableEntry[] {
  return [...regular, ...expandExpressTimetable(express)].sort(
    (a, b) =>
      timeToMinutes({ hour: a.leaveHour, minute: a.leaveMinute }) -
      timeToMinutes({ hour: b.leaveHour, minute: b.leaveMinute }),
  );
}
