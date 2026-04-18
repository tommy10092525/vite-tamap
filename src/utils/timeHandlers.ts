import * as z from "zod/v4";

import {
  ekitanSchema,
  holidayDataSchema,
  stationSchema,
  timetableSchema,
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

export function toms({
  hour,
  minute,
}: {
  hour: number;
  minute: number;
}) {
  return hour * 60 + minute;
}

export function timeDifference({
  nowInms,
  busInms,
}: {
  nowInms: number;
  busInms: number;
}) {
  return busInms - nowInms;
}

// 日付が祝日かどうかを判定
export function isHoliday({
  date,
  holidayData,
}: {
  date: Date;
  holidayData: z.infer<typeof holidayDataSchema>;
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
  holidayData: z.infer<typeof holidayDataSchema>;
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
  holidayData: z.infer<typeof holidayDataSchema>;
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
  timetable: z.infer<typeof timetableSchema>;
  station: z.infer<typeof stationSchema>;
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
export const sethAndm = ({
  date,
  h,
  m,
}: {
  date: Date;
  h: number;
  m: number;
}) => {
  const updatedDate = new Date(date);
  updatedDate.setHours(h, m);
  return updatedDate;
};

export const getDateAddedBus = ({
  dateToCheck,
  bus,
}: {
  dateToCheck: Date;
  bus: z.infer<typeof timetableSchema>[number];
}) => {
  if (!bus) {
    throw "引数のbusがundefined"
  }
  const newDate = sethAndm({
    date: dateToCheck,
    h: bus.leaveHour,
    m: bus.leaveMinute,
  });
  const newBus = {
    ...bus,
    stopList: bus.stopList.map((stop) => {
      // stListのそれぞれのオブジェクトについて，
      // mapのコールバック関数内でdateプロパティを新しく設定する
      const stopDate = sethAndm({
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
export function findNextBuses({
  timetable,
  holidayData,
  currentDate,
  length,
  isComingToHosei,
  station,
}: {
  timetable: z.infer<typeof timetableSchema>;
  holidayData: z.infer<typeof holidayDataSchema>;
  currentDate: Date;
  length: number;
  isComingToHosei: boolean;
  station: z.infer<typeof stationSchema>;
}) {
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentDay = dayIndices[currentDate.getDay()];
  const nowInms = toms({
    hour: currentHour,
    minute: currentMinutes,
  });
  const returnBuses = [];
  // 現在の曜日のバスを取得

  const newTimetable = filterByConditions({
    timetable: timetable.sort((a, b) => {
      if (
        a.leaveHour * 60 + a.leaveMinute >=
        b.leaveHour * 60 + b.leaveMinute
      ) {
        return 1;
      } else {
        return -1;
      }
    }),
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
        (bus) =>
          bus.day === dayToCheck ||
          (isWeekday(dayToCheck) && bus.day === "Weekday"),
      );
    let m = -1;
    if (length >= 1) {
      m = binarySearch({
        data: busesForDay,
        cmp: (bus: {
          leaveHour: number;
          leaveMinute: number;
        }) => {
          const busLeaveTime = toms({
            hour: bus.leaveHour,
            minute: bus.leaveMinute,
          });
          return (
            i > 0 ||
            timeDifference({
              nowInms,
              busInms: busLeaveTime,
            }) >= 0
          );
        },
      });
    } else {
      m = binarySearch({
        data: busesForDay,
        cmp: (bus: {
          leaveHour: number;
          leaveMinute: number;
        }) => {
          const busLeaveTime = toms({
            hour: bus.leaveHour,
            minute: bus.leaveMinute,
          });
          return (
            i > 0 ||
            timeDifference({
              nowInms,
              busInms: busLeaveTime,
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
export function timeToms(time: string) {
  const [hs, ms] = time.split(":").map(Number);
  return hs * 60 + ms;
}

// 分単位を `hh:mm` に戻す関数
export function msToTime(ms: number) {
  const hs = String(Math.floor(ms / 60));
  const mins = String(ms % 60).padStart(2, "0");
  return `${hs}:${mins}`;
}

export function getDateString(now: Date) {
  return `${now.getFullYear().toString().padStart(4, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")}`;
}

export function getTimeString(now: Date) {
  return `${now.getHours().toString()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

export const binarySearch = <T>({
  data,
  cmp: cmpCallbackFn,
}: {
  data: T[];
  cmp: (a: T) => boolean;
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
  ekitanData: z.infer<typeof ekitanSchema>;
  station: string;
  holidayData: z.infer<typeof holidayDataSchema>;
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
        return a.h * 60 + a.m - (b.h * 60 + b.m);
      })
      .map((item) => {
        const itemTime = item.h * 60 + item.m;
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
  ekitanData: z.infer<typeof ekitanSchema>;
  station: string;
  holidayData: z.infer<typeof holidayDataSchema>;
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
        return b.h * 60 + b.m - (a.h * 60 + a.m); // 降順
      })
      .map((item) => {
        const itemTime = item.h * 60 + item.m;
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

export const anomary20260401=({timetable,now}:{now:Date,timetable:z.infer<typeof timetableSchema>})=>{
  // https://www.hosei.ac.jp/application/files/6017/7443/1839/2026guidance_keio_bus_schedule.pdf


  const o:{[key:string]:{
    [key:number]:{
      [key:number]:number[]
    }
  }}={
    nishihachiojiToHosei:{
      1:{
        9:[4,12,22],
        11:[52],
        12:[2,12]
      },
      2:{
        8:[38,44],
        9:[12,22,32],
        10:[30,40,50]
      },
      3:{
        9:[4,12,22],
        10:[2,12,22],
        12:[32,42,55]
      },
      4:{
        9:[40,44,52],
        12:[40,44,52],
      },
      6:{
        9:[4,12,22],
        10:[2,12,22],
        12:[32,42,55]
      }
    },
    mejirodaiToHosei:{
      1:{
        9:[9,12,17,20,25,30,35],
        12:[0,0,10,10,20,20,30],
      },
      2:{
        8:[42,46,51,52],
        9:[17,20,25,30,35,40],
        10:[32,38,43,48,52,58],
        11:[3],
      },
      3:{
        8:[59],
        9:[9,12,20,25,30,35,49],
        10:[0,10,14,20,23,30],
        12:[40,40,50,50],
        13:[0,3,10]
      },
      4:{
        9:[42,45,48,52,54],
        10:[0,4],
        12:[32,42,48,52,52],
        13:[0,2]
      },
      6:{
        8:[59],
        9:[9,12,20,25,30,35,49],
        10:[0,10,14,20,23,30],
        12:[40,40,50,50],
        13:[0,3,10]
      },
    },
    hoseiToNishihachioji:{
      1:{
        12:[35,45,55],
        13:[5],
        15:[35,45,55],
        16:[5]
      },
      2:{
        12:[5,15,25,45,55],
        13:[35,45],
        15:[5,15,25,35],
      },
      3:{
        10:[35,55],
        14:[5,35],
        15:[5,35],
        16:[5,35],
      },
      4:{
        11:[48],
        12:[0,12],
        14:[48],
        15:[0,12]
      },
      6:{
        10:[35,55],
        14:[5,35],
        15:[5,35],
        16:[5,35],
      }
    },
    hoseiToMejirodai:{
      1:{
        12:[38,48,58],
        15:[38,48,58]
      },
      2:{
        12:[8,18,28,48,58],
        13:[38,48],
        15:[8,18,28]
      },
      3:{
        14:[8,38],
        15:[8,38],
        16:[8,38],
      },
      4:{
        11:[52],
        12:[4,16],
        14:[52],
        15:[4,16]
      },6:{
        10:[35,55],
        14:[8,38],
        15:[8,38],
        16:[8,38],
      }
    }
  }

  console.log(now)
  if(!(now<new Date("2026/4/1") || new Date("2026/4/6")<now)){
    let dateIndex=-1
    for(let date=1;date<=6;date++){
      if(date!==5 && now<new Date(`2026/4/${date+1}`)){
        dateIndex=date
        break
      }
    }
    Object.entries(o.nishihachiojiToHosei[dateIndex]).map(([key,value])=>{
      value.map(item=>{
        timetable.push({
          id:crypto.randomUUID(),
          leaveHour:Number(key),
          leaveMinute:item,
          stopList:[],
          day:"Weekday",
          isComingToHosei:true,
          station:"nishihachioji"
        })
      })
    })
    Object.entries(o.mejirodaiToHosei[dateIndex]).map(([key,value])=>{
      value.map(item=>{
        timetable.push({
          id:crypto.randomUUID(),
          leaveHour:Number(key),
          leaveMinute:item,
          stopList:[],
          day:"Weekday",
          isComingToHosei:true,
          station:"mejirodai"
        })
      })
    });
    Object.entries(o.hoseiToNishihachioji[dateIndex]).map(([key,value])=>{
      value.map(item=>{
        timetable.push({
          id:crypto.randomUUID(),
          leaveHour:Number(key),
          leaveMinute:item,
          stopList:[],
          day:"Weekday",
          isComingToHosei:false,
          station:"nishihachioji"
        })
      })
    })
    Object.entries(o.hoseiToMejirodai[dateIndex]).map(([key,value])=>{
      value.map(item=>{
        timetable.push({
          id:crypto.randomUUID(),
          leaveHour:Number(key),
          leaveMinute:item,
          stopList:[],
          day:"Weekday",
          isComingToHosei:false,
          station:"mejirodai"
        })
      })
    });
  }
  return timetable.sort((a,b)=>{
    return a.leaveHour*60+a.leaveMinute>b.leaveHour*60+b.leaveMinute ?1:-1;
  })
}

export const keioRapid=({ timetable }: { now: Date, timetable: z.infer<typeof timetableSchema> }):z.infer<typeof timetableSchema> =>{
  type EachTable={
    [key:number]:(number|{time:number,gym:boolean})[]
  }
  const table:{
    nishihachiojiToHosei:EachTable,
    mejirodaiToHosei:EachTable,
    hoseiToNishihachioji:EachTable,
    hoseiToMejirodai:EachTable
  } = {
    nishihachiojiToHosei: {
      8: [38, 
        {time:45,gym:true},
         {time:52,gym:true}],
      10: [26, 27, 31, 38],
      12: [56],
      13: [6],
      14:[46,56]
    }, mejirodaiToHosei: {
      8: [41, 46, 51, 53, 59],
      9: [0],
      10: [30, 31, 35, 39, 42, 46, 51, 54],
      13: [4, 10, 14],
      14: [54],
      15:[0,4]
    }, hoseiToNishihachioji: {
      12:[58],
      15:[28,35,45],
      17:[15,25,35],
      19:[5,15]
    },hoseiToMejirodai:{
      12:[58],
      15:[38,48,56],
      17:[18,28,38],
      19:[8,18]      
    }
  }

  const gen=({station,isComingToHosei,leaveHour,leaveMinute,gym}:{station:"nishihachioji" | "mejirodai" | "aihara"
    ,isComingToHosei:boolean,leaveHour:number,leaveMinute:number,gym:boolean}):z.infer<typeof timetableSchema>[number]=>{
    return {
      id:crypto.randomUUID(),
      day:"Weekday",station,isComingToHosei,leaveHour,leaveMinute,stopList:[],gym
    }
  }

  Object.entries(table.nishihachiojiToHosei).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"nishihachioji"
        }))
      }else{
        timetable.push(gen({
          gym:true,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"nishihachioji"
        }))
      }
    })
  })
  Object.entries(table.mejirodaiToHosei).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"mejirodai"
        }))
      }else{
        timetable.push(gen({
          gym:true,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"mejirodai"
        }))
      }
    })
  })

  Object.entries(table.hoseiToNishihachioji).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"nishihachioji"
        }))
      }else{
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"nishihachioji"
        }))
      }
    })
  })

  Object.entries(table.hoseiToMejirodai).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"mejirodai"
        }))
      }else{
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"mejirodai"
        }))
      }
    })
  })
  

  return timetable
}
