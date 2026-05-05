import jsdom from "jsdom"
const { JSDOM } = jsdom
import * as z from "zod"
import fs from "fs"

// npx tsx scraping.ts

type Eki={
  hour: number,
  minute: number,
  trainType: string,
  destination: string,
  direction: string,
  station: string,
  line: string,
  day: string 
}

type BusStop={
  hour: number;
  minute: number;
  name: string
}

type TimeTableElement={
  arriveHour: number,
  arriveMinute: number,
  station: string,
  isComingToHosei: boolean,
  id: string
} & Bus

type Bus={
  day: string,
  leaveHour: number,
  leaveMinute: number,
  stopList: BusStop[],
  url:string
}

async function getKeioStopList({ url }: { url: string }):Promise<BusStop[]> {
  const data = await fetch(url)
  const text = await data.text()
  const dom = new JSDOM(text);
  const document = dom.window.document
  const trs = [...document.querySelectorAll("#railroad-matrix>center>div")]
  const parsedScheduleEntries = trs.map(tr => {
    const timeString=tr.querySelector("span")?.textContent.match(/(\d{2}:\d{2})/)?.[0] as string
    // const hour = parseInt(z.string().parse((tr.querySelector("span")?.textContent?.match(/(\d{2}:)/)?.[0].slice(0, 2))))
    // const minute = parseInt(z.string().parse(tr.querySelector("span")?.textContent?.match(/(:\d{2})/)?.[0].slice(1, 3)))
    const [hour,minute]=timeString.split(":").map(item=>parseInt(item))
    const name = z.string().parse(tr.querySelector("strong")?.textContent?.replace(/[\n\r\t]/g, "").trim())
    return {  hour,minute,name }
  })
  return parsedScheduleEntries
}

async function getKeioTimeTable({ url, ignoreMejirodaiOnly }: { url: string, ignoreMejirodaiOnly: boolean }):Promise<Bus[]> {
  const wkDict = { wkd: "Weekday", std: "Saturday", snd: "Sunday" }
  const data = await fetch(url)
  const text = await data.text()
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("tr.l2")]
  const urls: { url: string, leaveHour: number, leaveMinute: number, day: string }[] = []
  trs.map(tr => {
    const leaveHour = parseInt(tr.querySelector("th.hour")?.textContent?.replace(/[\n\r\t]/g, "") as string)
    // let leaveHour = -1
    // if (r) {
    //   leaveHour = parseInt(r)
    // }
    for (const week in wkDict) {
      const day = tr.querySelector(`td.${week}`)
      const items = [...day?.querySelectorAll("div.diagram-item") || []]
      for (const item of items) {
        // indexOf("グ")===-1 グが検索でヒットしない，グリーンヒル寺田行きのバスではない
        const isGreenHill=item.querySelector("div.top")?.textContent?.indexOf("グ") !== -1
        const onlyMejirodai=item.querySelector("div.top")?.textContent?.indexOf("め") !== -1
        if (!isGreenHill && !(ignoreMejirodaiOnly && onlyMejirodai)) {
          const time = item.querySelector("span[aria-hidden='true']")
          const leaveMinute=parseInt(time?.textContent as string)
          const url = "https://transfer.navitime.biz" + item.querySelector("a")?.getAttribute("href")
          urls.push({ url, leaveHour: leaveHour, leaveMinute: leaveMinute, day: wkDict[week as keyof typeof wkDict] })
        }
      }
    }
  })
  const results = await Promise.all(urls.map(async ({ url, leaveHour: leaveHour, leaveMinute: leaveMinute, day }) => {
    const stopList = await getKeioStopList({ url })
    return { leaveHour,leaveMinute,stopList, day ,url}
  }))
  return results
}

async function getKanachuTimetable({ url }: { url: string }):Promise<Bus[]> {
  console.log(url)
  // 2026年3月30日神奈中HP仕様変更に伴う対応
  const data = await fetch(url)
  const text = await data.text()
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = document.querySelectorAll("tr");
  const urls: { url: string, leaveh: number, leavem: number, day: string }[] = []
  const days = ["Weekday", "Saturday", "Sunday"]
  for (const tr of trs) {
    const leaveHour = tr.querySelector("th>div")?.textContent?.replace(/[\n\r\t]/g, "")
    const tds = [...tr.querySelectorAll("td")];
    tds.map((td, index) => {
      const aTag = td.querySelector("a")
        const url = "https://transfer-cloud.navitime.biz" + aTag?.getAttribute("href")
        const leavem = aTag?.textContent?.replace(/[\n\r\t]/g, "")
        const sup=td.querySelector("sup")
        if (leaveHour && leavem && url && sup?.textContent!=="◎") {
          urls.push({ url, leaveh: parseInt(leaveHour), leavem: parseInt(leavem), day: days[index] })
        }
    })
  }
  const results = await Promise.all(urls.map(async ({ url, leaveh: leaveHour, leavem: leaveMinute, day }) => {
    const stopList = await getKanachuStopList({ url })
    return {leaveHour,leaveMinute, stopList, day,url }
  }))
  return results
}

async function getKanachuStopList({ url }: { url: string }):Promise<BusStop[]> {
  console.log(url)
  const data = await fetch(url)
  const text = await data.text()
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const stList: { hour: number, minute: number, name: string }[] = []
  const lis = document.querySelectorAll("div.box-content")
  for (const li of lis) {
    const stopName=z.string().parse(li.querySelector("div.ml-4.grow.text-lg.font-bold")?.textContent);
    const [h,m]=li.querySelector("div.flex.items-center.ml-8.flex.w-20.items-end.text-center.text-xl.font-bold > time")?.textContent?.split(":").map(item=>parseInt
      (item)) ?? [];
    stList.push({hour: h,minute: m,name: stopName})
  }
  return stList
}

const busRouteURLs = {
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
    aiharaTo:
      ["https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008000984-1",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008000987-12",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008001585-1"
      ],
    hoseiTo:
      [
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008000981-1",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008000988-6",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008001586-1",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022655&course-sequence=0008000987-22"
      ]
  }
}

async function getAllTimetables() {

  let aiharaToHosei: TimeTableElement[] = []
  const hoseiToAihara: TimeTableElement[] = []
  const kanachu=async()=>{

    for (const url of busRouteURLs.kanachu.aiharaTo) {
      const res = await getKanachuTimetable({ url })
      res.forEach(item => aiharaToHosei.push({ ...item, station: "aihara", isComingToHosei: true, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const url of busRouteURLs.kanachu.hoseiTo) {
      const res = await getKanachuTimetable({ url })
      res.forEach(item => hoseiToAihara.push({ ...item, station: "aihara", isComingToHosei: false, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const bus of aiharaToHosei) {
      for(const station of bus.stopList){
        if(station.name==="法政大学"){
          bus.arriveHour=station.hour;
          bus.arriveMinute=station.minute;
        }
      }
    }
    aiharaToHosei = structuredClone(aiharaToHosei).filter(bus => bus.arriveHour)
    for (const bus of hoseiToAihara) {
      for (const station of bus.stopList) {
        if (station.name === "相原駅西口") {
          bus.arriveHour = station.hour;
          bus.arriveMinute = station.minute;
          break; // Exit after the first iteration
        }
      }
    }
  }
  await kanachu()

  const kanachuTimetable = aiharaToHosei.concat(hoseiToAihara)

  const mejirodaiToHosei: TimeTableElement[] = []
  for (const url of busRouteURLs.keio.mejirodaiToHosei) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: false })
    res.forEach(item => mejirodaiToHosei.push({ ...item, station: "mejirodai", isComingToHosei: true, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
  }
  for (const bus of mejirodaiToHosei) {
    bus.arriveHour = bus.stopList.at(-1)?.hour as number
    bus.arriveMinute = bus.stopList.at(-1)?.minute as number
  }
  const nishihachiojiToHosei: TimeTableElement[] = []
  for (const url of busRouteURLs.keio.nishihachiojiToHosei) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: true })
    res.forEach(item => nishihachiojiToHosei.push({ ...item, station: "nishihachioji", isComingToHosei: true, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
  }
  for (const bus of nishihachiojiToHosei) {
    bus.arriveHour = bus.stopList.at(-1)?.hour as number
    bus.arriveMinute = bus.stopList.at(-1)?.minute as number
  }
  const hoseiToMejirodai: TimeTableElement[] = []
  const hoseiToNishihachioji: TimeTableElement[] = []

  for (const url of busRouteURLs.keio.hoseiTo) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: false })
    res.forEach(item => hoseiToMejirodai.push({ ...item, station: "mejirodai", isComingToHosei: false, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
  }
  for (const url of busRouteURLs.keio.hoseiTo) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: true })
    res.forEach(item => hoseiToNishihachioji.push({ ...item, station: "nishihachioji", isComingToHosei: false, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
  }
  for (const bus of hoseiToMejirodai) {
    for (const station of bus.stopList) {
      if (station.name === "めじろ台駅") {
        bus.arriveHour = station.hour;
        bus.arriveMinute = station.minute;
        break; // Exit after the first iteration
      }
    }
  }
  for (const bus of hoseiToNishihachioji) {
    for (const st of bus.stopList) {
      if (st.name === "西八王子駅南口") {
        bus.arriveHour = st.hour;
        bus.arriveMinute = st.minute;
        break; // Exit after the first iteration
      }
    }
  }
  const keioTimetable = hoseiToMejirodai
    .concat(hoseiToNishihachioji)
    .concat(mejirodaiToHosei)
    .concat(nishihachiojiToHosei)
    .filter(bus => bus.arriveHour)
  const allTimetable = kanachuTimetable.concat(keioTimetable).sort((a, b) => {
    if (a.arriveHour * 60 + a.arriveMinute >= b.arriveHour * 60 + a.arriveMinute) {
      return 1
    } else {
      return -1
    }
  })
  const write=()=>{
    const now=new Date();
    fs.writeFileSync(`src/utils/TimeTable_${now.getMonth()+1}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}.json`, JSON.stringify(allTimetable))
  }
  write()
}

async function getEkitan({ url }: { url: string }):Promise<Eki[]> {

  const days = ["Weekday", "Saturday", "Sunday"]
  const result: Eki[] = []
  await Promise.all(days.map(async (day, idx) => {
    const data = await fetch(url)
    const text = await data.text()
    const dom = new JSDOM(text);

    const document = dom.window.document
    const directions = document.querySelectorAll("li.ek-direction_tab > a")
    const line = z.string().parse(document.querySelector("li.line-name a")?.textContent)
    const station = z.string().parse(document.querySelector("div.station-name a")?.textContent?.replace(/\(神奈川\)/, ""));
    [...document.querySelectorAll("div.tab-content-inner")].map((d, idx) => {
      for (const el of d.querySelectorAll("li.ek-narrow")) {
        let time = ""
        try {
          time = z.string().parse(el.querySelector("span.dep-time")?.textContent)
        } catch {
          break
        }
        const [h, m] = time.split(":").map(item => parseInt(item))
        const trainType = z.string().parse(el.querySelector("span.train-type")?.textContent)
        const destination = z.string().parse(el.querySelector("span.destination")?.textContent)
        const direction = z.string().parse(directions[idx]?.textContent)
        result.push({ hour: h, minute: m, trainType, destination, direction, station, line, day })
      }
    })
  }))
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
    "https://ekitan.com/timetable/railway/line-station/262-31/d1"
  ]
  
  const result=(await Promise.all(urls.map(async url => {
    return await getEkitan({ url })
  }))).flat()

  result.map(eki => {
    switch (eki.destination) {
      case "京王多摩センターから特急新宿行き行き":
        eki.destination = "新宿行き";
        eki.trainType = "各停・京王多摩センターから特急";
        break;
      case "新線新宿から各駅停車本八幡行き行き":
        eki.destination = "新宿行き"
        eki.trainType = "各停・京王多摩センターから特急";
        break
      case "高幡不動から特急新宿行き行き":
        eki.destination = "新宿行き"
        eki.trainType = "各停・高幡不動から特急"
        break
      case "高幡不動から急行新宿行き行き":
        eki.destination = "新宿行き";
        eki.trainType = "各停・高幡不動から急行";
        break;
    }
    if (eki.station === "八王子駅" || eki.station === "京王八王子駅") {
      eki.station = "JR八王子駅/京王八王子駅"
    }
  })
  const now=new Date();
  fs.writeFileSync(`src/utils/ekitan._${now.getMonth()+1}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}.json`, JSON.stringify(result, null, 2))

}

// console.log(await getKeioStopList({
//   url:"https://transfer.navitime.biz/bus-navi/pc/diagram/BusRouteTimetable?operation=82670033&datetime=2026-04-18T06%3A44%3A00&node=00021279&course=0000456026&stop-no=1",

// }))

// console.log(await getKeioStopList({
//   url:"https://transfer.navitime.biz/bus-navi/pc/diagram/BusRouteTimetable?operation=82670034&datetime=2026-04-18T06%3A56%3A00&node=00021279&course=0000456026&stop-no=1"
// }))

getAllTimetables()
// getAllEkitan()


// console.table(result)
// console.log(result)