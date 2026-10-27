import jsdom from "jsdom";
const { JSDOM } = jsdom;
import * as v from "valibot";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { Item } from "@radix-ui/react-accordion";

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

/** 各駅で乗り降りするバス停の名前 */
export const stopNames = {
  hosei: "法政大学",
  nishihachioji: "西八王子駅南口",
  mejirodai: "めじろ台駅",
  aihara: "相原駅西口",
} as const;

/**
 * バス停リストからfrom→toの乗車区間を切り出し、出発・到着時刻を返します。
 * 始発でない便（例：西八王子駅南口発でめじろ台駅から乗る）でも、乗るバス停の時刻を出発時刻にします。
 * 区間を通らない便の場合はnullを返します。
 */
export function extractRide(stopList: BusStop[], from: string, to: string) {
  const fromIndex = stopList.findIndex((stop) => stop.name === from);
  const toIndex = stopList.findIndex(
    (stop, i) => fromIndex !== -1 && i > fromIndex && stop.name === to,
  );
  if (fromIndex === -1 || toIndex === -1) {
    return null;
  }
  const ride = stopList.slice(fromIndex, toIndex + 1);
  return {
    leaveHour: ride[0].hour,
    leaveMinute: ride[0].minute,
    arriveHour: ride[ride.length - 1].hour,
    arriveMinute: ride[ride.length - 1].minute,
    stopList: ride,
  };
}

/** 1便のバス停リストから、指定した駅ごとの時刻表の行を作ります。区間を通らない駅の行は作りません。 */
export function buildTimetableRows({
  stopList,
  day,
  stations,
  isComingToHosei,
}: {
  stopList: BusStop[];
  day: string;
  stations: readonly Station[];
  isComingToHosei: boolean;
}) {
  return stations.flatMap((station) => {
    const ride = isComingToHosei
      ? extractRide(stopList, stopNames[station], stopNames.hosei)
      : extractRide(stopList, stopNames.hosei, stopNames[station]);
    return ride ? [{ ...ride, day, station, isComingToHosei }] : [];
  });
}

/** URLからバス停の一覧を取得します（京王） */
export async function getKeioBusStopList(url: string) {
  const data = await fetch(url);
  const text = await data.text();
  return { stopList: parseKeioBusStopList(text) };
}

/** 京王の停車時刻表ページのHTMLからバス停の一覧を取り出します */
export function parseKeioBusStopList(html: string): BusStop[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("#railroad-matrix>center>div")];
  const parsedScheduleEntries = trs.map((tr) => {
    const timeString = v.parse(
      v.string(),
      tr.querySelector("span")?.textContent?.match(/(\d{2}:\d{2})/)?.[0],
    );
    const [hour, minute] = timeString.split(":").map((item) => parseInt(item));
    const name = v.parse(v.string(), 
      tr
        .querySelector("strong")
        ?.textContent?.replace(/[\n\r\t]/g, "")
        .trim(),
    );
    return { hour, minute, name };
  });
  return parsedScheduleEntries;
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
  const weekSchema = v.picklist(["wkd", "std", "snd"]);
  const data = await fetch(url);
  const text = await data.text();
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("tr.l2")];
  const urls: { day: (typeof wkDict)[keyof typeof wkDict]; url: string }[] = [];
  trs.map((tr) => {
    Object.keys(wkDict).map((key) => {
      const week = v.parse(weekSchema, key);
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
            day: wkDict[week],
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
  return parseKanachuBusUrls(text);
};

/**
 * 神奈中の時刻表ページのHTMLから、便ごとのバス停ページのURLを取り出します。
 * 1つのセル（1時間×曜日）に複数の便があるので、セル内のリンクをすべて読みます。
 * ◎の付いた便（法政大学を経由しない便）は除外します。
 */
export function parseKanachuBusUrls(html: string) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const trs = document.querySelectorAll("tr");
  const urls: { url: string; day: string }[] = [];
  const days = ["Weekday", "Saturday", "Sunday"] as const;
  [...trs].map((tr) => {
    const tds = [...tr.querySelectorAll("td")];
    tds.map((td, index) => {
      const aTags = [...td.querySelectorAll("a")];
      aTags.map((aTag) => {
        const hrefAttribute = aTag.getAttribute("href");
        if (hrefAttribute === null || getKanachuMark(aTag, td) === "◎") {
          return;
        }
        urls.push({
          day: days[index],
          url: `https://transfer-cloud.navitime.biz${hrefAttribute}`,
        });
      });
    });
  });
  return urls;
}

/** 便のリンクに付いている記号（supの中身）を返します。リンクの中・直後・便ごとの囲み要素の順に探します。 */
function getKanachuMark(aTag: Element, td: Element) {
  const inner = aTag.querySelector("sup");
  if (inner) {
    return inner.textContent?.trim();
  }
  const next = aTag.nextElementSibling;
  if (next?.tagName === "SUP") {
    return next.textContent?.trim();
  }
  // 便ごとにリンクとsupを囲む要素がある場合（囲みの中のリンクが1つだけのとき）
  let parent = aTag.parentElement;
  while (parent && parent !== td) {
    if (parent.querySelectorAll("a").length > 1) {
      break;
    }
    const sup = parent.querySelector("sup");
    if (sup) {
      return sup.textContent?.trim();
    }
    parent = parent.parentElement;
  }
  return undefined;
}

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
    const stopName = v.parse(v.string(), li.querySelector("div.ml-4.grow.text-lg.font-bold")?.textContent);
    const [hour, minute] =
      li
        .querySelector(
          "div.flex.items-center.ml-8.flex.w-20.min-w-20.text-center.text-xl.font-bold > time",
        )
        ?.textContent?.split(":")
        .map((item) => parseInt(item)) ?? [];
    busStopList.push({ hour: hour, minute: minute, name: stopName });
  }
  const departure=busStopList.find(({name})=>name==="相原駅西口"||name==="法政大学")
  if(!departure){
    throw new Error("バス停リストに相原駅西口・法政大学が含まれていません。")
  }

  const arrival=busStopList.find(({name})=>name!==departure.name&&(name==="相原駅西口"||name==="法政大学"))
  if(!arrival){
    throw new Error("バス停リストに相原駅西口・法政大学の片方しか含まれていません")
  }

  const leaveHour = departure.hour
  const leaveMinute = departure.minute
  const arriveHour = arrival.hour
  const arriveMinute = arrival.minute
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

export const getAllBusTimeTable = async () => {
  const timetable: ReturnType<typeof buildTimetableRows> = [];

  // 時刻表のURLから便ごとのバス停リストを取得し、駅ごとの乗車区間を時刻表に追加します。
  // 便ごとの取得もawaitして、書き込む前にすべて揃うようにします。
  const addKeioRoutes = async ({
    urls,
    stations,
    isComingToHosei,
  }: {
    urls: readonly string[];
    stations: readonly Station[];
    isComingToHosei: boolean;
  }) => {
    await Promise.all(urls.map(async (url) => {
      const result = await getKeioBusUrls({ url, ignoreMejirodaiOnly: false });
      await Promise.all(result.map(async ({ day, url }) => {
        const { stopList } = await getKeioBusStopList(url);
        timetable.push(...buildTimetableRows({ stopList, day, stations, isComingToHosei }));
      }));
    }));
  };

  const addKanachuRoutes = async ({
    urls,
    isComingToHosei,
  }: {
    urls: readonly string[];
    isComingToHosei: boolean;
  }) => {
    await Promise.all(urls.map(async (url) => {
      const result = await getKanachuBusUrls(url);
      await Promise.all(result.map(async ({ day, url }) => {
        const { stopList } = await getKanachuBusStopList(url);
        timetable.push(...buildTimetableRows({ stopList, day, stations: ["aihara"], isComingToHosei }));
      }));
    }));
  };

  await Promise.all([
    // めじろ台→法政
    addKeioRoutes({ urls: busRouteURLs.keio.mejirodaiToHosei, stations: ["mejirodai"], isComingToHosei: true }),
    // 西八王子→法政
    addKeioRoutes({ urls: busRouteURLs.keio.nishihachiojiToHosei, stations: ["nishihachioji"], isComingToHosei: true }),
    // 法政→めじろ台・西八王子（1便から駅ごとに別々の区間を切り出す）
    addKeioRoutes({ urls: busRouteURLs.keio.hoseiTo, stations: ["nishihachioji", "mejirodai"], isComingToHosei: false }),
    // 相原→法政
    addKanachuRoutes({ urls: busRouteURLs.kanachu.aiharaTo, isComingToHosei: true }),
    // 法政→相原
    addKanachuRoutes({ urls: busRouteURLs.kanachu.hoseiTo, isComingToHosei: false }),
  ]);

  const write=()=>{
    fs.writeFileSync(`src/utils/TimeTable.json`,
     JSON.stringify(timetable.map(item=>({...item,id:randomUUID().toString()}))))
  }
  write()
  return timetable
};

// `npx tsx scraping.ts`で直接実行したときだけ取得する。
// テストなどからimportしたときにスクレイピングとTimeTable.jsonの上書きが走らないようにする。
const isMain =
  typeof process.argv[1] === "string" &&
  path.resolve(fileURLToPath(import.meta.url)).toLowerCase() ===
    path.resolve(process.argv[1]).toLowerCase();
if (isMain) {
  getAllBusTimeTable();
}

export const getEkitan=async(url:string) => {
  const days = ["Weekday", "Saturday", "Sunday"];
  const result: Eki[] = [];
  await Promise.all(
    days.map(async (day, idx) => {
      const _url=new URL(url)
      _url.searchParams.append("dw",idx.toString())
      _url.searchParams.append("view","list")
      const data = await fetch(_url.toString());
      const text = await data.text();
      const dom = new JSDOM(text);

      const document = dom.window.document;
      const directions = document.querySelectorAll("li.ek-direction_tab > a");
      const line = v.parse(v.string(), document.querySelector("li.line-name a")?.textContent);
      const station = v.parse(v.string(), 
          document
            .querySelector("div.station-name a")
            ?.textContent?.replace(/\(神奈川\)/, ""),
        );
      [...document.querySelectorAll("div.tab-content-inner")].map((d, idx) => {
        for (const el of d.querySelectorAll("li.ek-narrow")) {
          let time = "";
          try {
            time = v.parse(v.string(), el.querySelector("span.dep-time")?.textContent);
          } catch {
            break;
          }
          const [h, m] = time.split(":").map((item) => parseInt(item));
          const trainType = v.parse(v.string(), el.querySelector("span.train-type")?.textContent);
          const destination = v.parse(v.string(), el.querySelector("span.destination")?.textContent);
          const direction = v.parse(v.string(), directions[idx]?.textContent);
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

export const getAllEkitan=async()=>{
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
        return await getEkitan(url);
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
  fs.writeFileSync(
    `src/utils/ekitan.json`,
    JSON.stringify(result, null, 2),
  );
}

// getAllEkitan()
