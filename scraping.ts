import jsdom from "jsdom";
const { JSDOM } = jsdom;
import * as z from "zod";
import fs from "fs";
import { randomUUID } from "crypto";

// npx tsx scraping.ts

type Eki = {
  hour: number;
  minute: number;
  trainType: string;
  destination: string;
  direction: string;
  station: string;
  line: string;
  day: string;
};

type BusStop = {
  hour: number;
  minute: number;
  name: string;
};

type TimeTableElement = {
  arriveHour: number;
  arriveMinute: number;
  station: string;
  isComingToHosei: boolean;
  id: string;
} & Bus;

type Bus = {
  day: string;
  leaveHour: number;
  leaveMinute: number;
  stopList: BusStop[];
  url: string;
};

type Station = "nishihachioji" | "mejirodai" | "aihara";

/** URLからバス停の一覧を取得します（京王） */
export async function getKeioBusStopList(url: string) {
  const data = await fetch(url);
  const text = await data.text();
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("#railroad-matrix>center>div")];
  const parsedScheduleEntries = trs.map((tr) => {
    const timeString = tr
      .querySelector("span")
      ?.textContent.match(/(\d{2}:\d{2})/)?.[0] as string;
    const [hour, minute] = timeString.split(":").map((item) => parseInt(item));
    const name = z.string().parse(
      tr
        .querySelector("strong")
        ?.textContent?.replace(/[\n\r\t]/g, "")
        .trim(),
    );
    return { hour, minute, name };
  });

  // バス停の最初と最後から出発時刻と到着時刻を取得します。
  const leaveHour = parsedScheduleEntries[0].hour as number;
  const leaveMinute = parsedScheduleEntries[0].minute as number;
  const arriveHour = parsedScheduleEntries.at(-1)?.hour as number;
  const arriveMinute = parsedScheduleEntries.at(-1)?.minute as number;

  return {
    leaveHour,
    leaveMinute,
    arriveHour,
    arriveMinute,
    stopList: parsedScheduleEntries,
  };
}

/** 時刻表のURLからバス停のURLリストを返します。（京王） */
export const getKeioBusUrls = async ({
  url,
  ignoreMejirodaiOnly,
}: {
  url: string;
  ignoreMejirodaiOnly: boolean;
}) => {
  const wkDict = { wkd: "Weekday", std: "Saturday", snd: "Sunday" } as const;
  const data = await fetch(url);
  const text = await data.text();
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("tr.l2")];
  const urls: { day: (typeof wkDict)[keyof typeof wkDict]; url: string }[] = [];
  trs.map((tr) => {
    Object.keys(wkDict).map((week) => {
      const day = tr.querySelector(`td.${week}`);
      const items = [...(day?.querySelectorAll("div.diagram-item") || [])];
      items.map((item) => {
        const isGreenHill =
          item.querySelector("div.top")?.textContent?.indexOf("グ") !== -1;
        const onlyMejirodai =
          item.querySelector("div.top")?.textContent?.indexOf("め") !== -1;
        if (!isGreenHill && !(ignoreMejirodaiOnly && onlyMejirodai)) {
          const url = `https://transfer.navitime.biz${item.querySelector("a")?.getAttribute("href")}`;
          urls.push({
            day: wkDict[week as keyof typeof wkDict],
            url,
          });
        }
      });
    });
  });
  return urls;
};

/** 時刻表のURLからバス停のURLリストを返します。 */
export const getKanachuBusUrls = async (url: string) => {
  const data = await fetch(url,{
    headers:{
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"
    }
  });
  const text = await data.text();
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = document.querySelectorAll("tr");
  const urls: { url: string; day: string }[] = [];
  const days = ["Weekday", "Saturday", "Sunday"] as const;
  [...trs].map((tr) => {
    const tds = [...tr.querySelectorAll("td")];
    tds.map((td, index) => {
      const aTag = td.querySelector("a");
      const hrefAttribute=aTag?.getAttribute("href")

      const nextUrl = `https://transfer-cloud.navitime.biz${hrefAttribute}`;
      const sup = td.querySelector("sup")?.textContent;
      if (hrefAttribute!==undefined && sup !== "◎") {
        urls.push({
          day: days[index],
          url: nextUrl,
        });
      }
    });
  });
  return urls;
};

/** バス停の一覧を取得します（神奈中バス） */
export async function getKanachuBusStopList(url: string) {
  const data = await fetch(url,{
    headers:{
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36"
    }
  });
  const text = await data.text();
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const busStopList: { hour: number; minute: number; name: string }[] = [];
  const lis = document.querySelectorAll("div.box-content");
  for (const li of lis) {
    const stopName = z
      .string()
      .parse(li.querySelector("div.ml-4.grow.text-lg.font-bold")?.textContent);
    const [hour, minute] =
      li
        .querySelector(
          "div.flex.items-center.ml-8.flex.w-20.min-w-20.text-center.text-xl.font-bold > time",
        )
        ?.textContent?.split(":")
        .map((item) => parseInt(item)) ?? [];
    busStopList.push({ hour: hour, minute: minute, name: stopName });
  }
  const leaveHour = busStopList.at(0)?.hour as number;
  const leaveMinute = busStopList.at(0)?.minute as number;
  const arriveHour = busStopList.at(-1)?.hour as number;
  const arriveMinute = busStopList.at(-1)?.minute as number;
  return {
    leaveHour,
    leaveMinute,
    arriveHour,
    arriveMinute,
    stopList: busStopList,
  };
}

export const busRouteURLs = {
  keio: {
    nishihachiojiToHosei: [
      "https://transfer.navitime.biz/bus-navi/pc/diagram/BusDiagram?orvCode=00020677&course=0000456027&stopNo=11",
    ],
    mejirodaiToHosei: [
      "https://transfer.navitime.biz/bus-navi/pc/diagram/BusDiagram?orvCode=00020064&course=0000456027&stopNo=17",
    ],
    hoseiTo: [
      "https://transfer.navitime.biz/bus-navi/pc/diagram/BusDiagram?orvCode=00021279&course=0000456026&stopNo=1",
    ],
  },
  kanachu: {
    aiharaTo: [
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008000984-1",
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008000987-12",
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008001585-1",
    ],
    hoseiTo: [
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008000981-1",
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008000988-6",
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008001586-1",
      "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008000987-22",
    ],
  },
} as const;

export const getAllTimeTable = async () => {
  // 関数が返す既定の値のほかに、曜日・駅・向きを返す
  const timetable: (Awaited<ReturnType<typeof getKeioBusStopList>> & {
    day: string;
    station: Station;
    isComingToHosei: boolean;
  })[] = [];

  // めじろ台→法政
  await Promise.all(busRouteURLs.keio.mejirodaiToHosei.map(async(url)=>{
    const result=await getKeioBusUrls({url,ignoreMejirodaiOnly:false});
    result.map(async({day,url})=>{
      const busStopList=await getKeioBusStopList(url);
      timetable.push({
        ...busStopList,
        day,
        station:"mejirodai",
        isComingToHosei:true
      })
    })
  }))

  // 西八王子→法政
  await Promise.all(busRouteURLs.keio.mejirodaiToHosei.map(async(url)=>{
    const result=await getKeioBusUrls({url,ignoreMejirodaiOnly:false});
    result.map(async({day,url})=>{
      const busStopList=await getKeioBusStopList(url);
      timetable.push({
        ...busStopList,
        day,
        station:"nishihachioji",
        isComingToHosei:true
      })
    })
  }))

  // 法政→めじろ台・西八王子
  await Promise.all(busRouteURLs.keio.hoseiTo.map(async (url) => {
    const result = await getKeioBusUrls({ url, ignoreMejirodaiOnly: false });
    result.map(async ({ day, url }) => {
      const busStopList = await getKeioBusStopList(url);
      timetable.push({
        ...busStopList,
        day,
        station: "nishihachioji",
        isComingToHosei: false,
      });
      timetable.push({
        ...busStopList,
        day,
        station: "mejirodai",
        isComingToHosei: false,
      });
    });
  }));

  // 相原→法政
  await Promise.all(busRouteURLs.kanachu.aiharaTo.map(async(url)=>{
    const result=await getKanachuBusUrls(url)
    result.map(async({day,url})=>{
      const busStopList=await getKanachuBusStopList(url)
      timetable.push({...busStopList,day,isComingToHosei:true,station:"aihara"})
    })
  }))

  // 法政→相原
  await Promise.all(busRouteURLs.kanachu.hoseiTo.map(async(url)=>{
    const result=await getKanachuBusUrls(url)
    result.map(async({day,url})=>{
      const busStopList=await getKanachuBusStopList(url)
      timetable.push({...busStopList,day,station:"aihara",isComingToHosei:false})
    })
  }))

  const write=()=>{
    fs.writeFileSync(`src/utils/TimeTable.json`,
     JSON.stringify(timetable.map(item=>({...item,id:randomUUID().toString()}))))
  }
  write()
  return timetable
};

getAllTimeTable()

async function getEkitan({ url }: { url: string }): Promise<Eki[]> {
  const days = ["Weekday", "Saturday", "Sunday"];
  const result: Eki[] = [];
  await Promise.all(
    days.map(async (day, idx) => {
      const data = await fetch(url);
      const text = await data.text();
      const dom = new JSDOM(text);

      const document = dom.window.document;
      const directions = document.querySelectorAll("li.ek-direction_tab > a");
      const line = z
        .string()
        .parse(document.querySelector("li.line-name a")?.textContent);
      const station = z
        .string()
        .parse(
          document
            .querySelector("div.station-name a")
            ?.textContent?.replace(/\(神奈川\)/, ""),
        );
      [...document.querySelectorAll("div.tab-content-inner")].map((d, idx) => {
        for (const el of d.querySelectorAll("li.ek-narrow")) {
          let time = "";
          try {
            time = z
              .string()
              .parse(el.querySelector("span.dep-time")?.textContent);
          } catch {
            break;
          }
          const [h, m] = time.split(":").map((item) => parseInt(item));
          const trainType = z
            .string()
            .parse(el.querySelector("span.train-type")?.textContent);
          const destination = z
            .string()
            .parse(el.querySelector("span.destination")?.textContent);
          const direction = z.string().parse(directions[idx]?.textContent);
          result.push({
            hour: h,
            minute: m,
            trainType,
            destination,
            direction,
            station,
            line,
            day,
          });
        }
      });
    }),
  );
  return result;
}

async function getAllEkitan() {
  const urls = [
    "https://ekitan.com/timetable/railway/line-station/163-16/d1",
    "https://ekitan.com/timetable/railway/line-station/264-3/d1",
    "https://ekitan.com/timetable/railway/line-station/180-22/d1",
    "https://ekitan.com/timetable/railway/line-station/180-21/d1",
    "https://ekitan.com/timetable/railway/line-station/163-19/d1",
    "https://ekitan.com/timetable/railway/line-station/25-0/d1",
    "https://ekitan.com/timetable/railway/line-station/110-17/d1",
    "https://ekitan.com/timetable/railway/line-station/163-15/d1",
    "https://ekitan.com/timetable/railway/line-station/261-11/d1",
    "https://ekitan.com/timetable/railway/line-station/262-31/d1",
  ];

  const result = (
    await Promise.all(
      urls.map(async (url) => {
        return await getEkitan({ url });
      }),
    )
  ).flat();

  result.map((eki) => {
    switch (eki.destination) {
      case "京王多摩センターから特急新宿行き行き":
        eki.destination = "新宿行き";
        eki.trainType = "各停・京王多摩センターから特急";
        break;
      case "新線新宿から各駅停車本八幡行き行き":
        eki.destination = "新宿行き";
        eki.trainType = "各停・京王多摩センターから特急";
        break;
      case "高幡不動から特急新宿行き行き":
        eki.destination = "新宿行き";
        eki.trainType = "各停・高幡不動から特急";
        break;
      case "高幡不動から急行新宿行き行き":
        eki.destination = "新宿行き";
        eki.trainType = "各停・高幡不動から急行";
        break;
    }
    if (eki.station === "八王子駅" || eki.station === "京王八王子駅") {
      eki.station = "JR八王子駅/京王八王子駅";
    }
  });
  const now = new Date();
  fs.writeFileSync(
    `src/utils/ekitan._${now.getMonth() + 1}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}.json`,
    JSON.stringify(result, null, 2),
  );
}
