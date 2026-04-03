import jsdom from "jsdom"
const { JSDOM } = jsdom
import * as z from "zod"
import fs from "fs"
import { timeToms } from "./src/utils/timeHandlers";

async function getKeiostList({ url }: { url: string }) {
  try {

    const dom = await JSDOM.fromURL(url);
    const document = dom.window.document
    const trs = [...document.querySelectorAll("#railroad-matrix>center>div")]
    const stList = trs.map(tr => {
      const h = parseInt(z.string().parse((tr.querySelector("span")?.textContent?.match(/(\d{2}:)/)?.[0].slice(0, 2))))
      const m = parseInt(z.string().parse(tr.querySelector("span")?.textContent?.match(/(:\d{2})/)?.[0].slice(1, 3)))

      const st = z.string().parse(tr.querySelector("strong")?.textContent?.replace(/[\n\r\t]/g, "").trim())
      return { h, m, st }
    })
    return stList
  } catch {
    return []
  }
}

async function getKeioTimeTable({ url, ignoreMejirodaiOnly }: { url: string, ignoreMejirodaiOnly: boolean }) {
  const wkDict = { wkd: "Weekday", std: "Saturday", snd: "Sunday" }
  const dom = await JSDOM.fromURL(url);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("tr.l2")]
  const urls: { url: string, leaveh: number, leavem: number, day: string }[] = []
  trs.map(tr => {
    const r = tr.querySelector("th.h")?.textContent?.replace(/[\n\r\t]/g, "")
    let leaveh = -1
    if (r) {
      leaveh = parseInt(r)
    } else {
    }
    for (const week in wkDict) {
      const day = tr.querySelector(`td.${week}`)
      const items = [...day?.querySelectorAll("div.diagram-item") || []]
      for (const item of items) {
        // indexOf("グ")===-1 グが検索でヒットしない，グリーンヒル寺田行きのバスではない
        if (item.querySelector("div.top")?.textContent?.indexOf("グ") === -1 && (!ignoreMejirodaiOnly || item.querySelector("div.top")?.textContent?.indexOf("め") === -1)) {
          const time = item.querySelector("span[aria-hidden='true']")
          let leavem = -1
          if (time) {
            leavem = parseInt(z.string().parse(time?.textContent))
          }
          const url = "https://transfer.navitime.biz" + item.querySelector("a")?.getAttribute("href")
          urls.push({ url, leaveh, leavem, day: wkDict[week as keyof typeof wkDict] })
        }
      }
    }
  })
  const results = await Promise.all(urls.map(async ({ url, leaveh, leavem, day }) => {
    const stList = await getKeiostList({ url })
    return { leaveh, leavem, stList, day }
  }))
  return results
}

async function getKanachuTimetable({ url }: { url: string }) {
  // 2026年3月30日　神奈中HP仕様変更に伴う対応
  const data = await fetch(url)
  const text = await data.text()
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const trs = [...document.querySelectorAll("tr")];
  const urls: { url: string, leaveh: number, leavem: number, day: string }[] = []
  const days = ["Weekday", "Saturday", "Sunday"]
  for (const tr of trs) {
    const leaveh = tr.querySelector("th>div")?.textContent?.replace(/[\n\r\t]/g, "")
    const tds = [...tr.querySelectorAll("td")];
    tds.map((td, index) => {
      const aTags = [...td.querySelectorAll("a")];
      aTags.map(aTag => {
        const url = "https://transfer-cloud.navitime.biz" + aTag.getAttribute("href")
        console.log(url)
        const leavem = aTag.textContent?.replace(/[\n\r\t]/g, "")
        if (leaveh && leavem && url) {
          urls.push({ url, leaveh: parseInt(leaveh), leavem: parseInt(leavem), day: days[index] })
        }
      })
    })
  }
  const results = await Promise.all(urls.map(async ({ url, leaveh, leavem, day }) => {
    const stList = await getKanachustList({ url })
    return { leaveh, leavem, stList, day }
  }))
  return results
}

async function getKanachustList({ url }: { url: string }) {

  const data = await fetch(url)
  const text = await data.text()
  const dom = new JSDOM(text);
  const document = dom.window.document;
  const stList: { h: number, m: number, st: string }[] = []
  const lis = document.querySelectorAll("ul>li")
  console.log(lis)
  console.log(lis.length)
  for (const li of lis) {
    const st=z.string().parse(li.querySelector("div.ml-4.grow.text-lg.font-bold")?.textContent);
    const [h,m]=li.querySelector("div.flex.items-center.ml-8.flex.w-20.items-end.text-center.text-xl.font-bold > time")?.textContent?.split(":").map(item=>Number(item)) ?? [];
    stList.push({h,m,st})
  }
  return stList

}

const busRouteUrls = {
  "keio": {
    "nishihachiojiToHosei": [
      "https://transfer.navitime.biz/bus-navi/pc/diagram/BusDiagram?orvCode=00020677&course=0000456027&stopNo=11",
    ],
    "mejirodaiToHosei": [
      "https://transfer.navitime.biz/bus-navi/pc/diagram/BusDiagram?orvCode=00020064&course=0000456027&stopNo=17",
    ],
    "hoseiTo": [
      "https://transfer.navitime.biz/bus-navi/pc/diagram/BusDiagram?orvCode=00021279&course=0000456026&stopNo=1",
    ],
  },
  "kanachu": {
    "aiharaTo":
      ["https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022822&course-sequence=0008002246-1",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022822&course-sequence=0008000987-12",
      ],
    "hoseiTo":
      [
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022655&course-sequence=0008000981-1",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022655&course-sequence=0008000988-6",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022655&course-sequence=0008000952-1",
        "https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022655&course-sequence=0008000987-22"
      ]
  }
}

async function getAllTimetables() {
  let aiharaToHosei: { leaveh: number, leavem: number, arriveh: number, arrivem: number, stList: { h: number, m: number, st: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
  for (const url of busRouteUrls.kanachu.aiharaTo) {
    const res = await getKanachuTimetable({ url })
    res.forEach(item => aiharaToHosei.push({ ...item, station: "aihara", isComingToHosei: true, arriveh: -1, arrivem: -1, id: crypto.randomUUID() }))
  }
  const hoseiToAihara: { leaveh: number, leavem: number, arriveh: number, arrivem: number, stList: { h: number, m: number, st: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
  for (const url of busRouteUrls.kanachu.hoseiTo) {
    const res = await getKanachuTimetable({ url })
    res.forEach(item => hoseiToAihara.push({ ...item, station: "aihara", isComingToHosei: false, arriveh: -1, arrivem: -1, id: crypto.randomUUID() }))
  }
  for (const bus of aiharaToHosei) {
    bus.arriveh = bus.stList.at(-1)?.h as number
    bus.arrivem = bus.stList.at(-1)?.m as number
  }
  aiharaToHosei = structuredClone(aiharaToHosei).filter(bus => bus.arriveh)
  for (const bus of hoseiToAihara) {
    for (const st of bus.stList) {
      if (st.st === "相原駅西口") {
        bus.arriveh = st.h
        bus.arrivem = st.m
        break; // Exit after the first iteration
      }
    }
  }
  const kanachuTimetable = aiharaToHosei.concat(hoseiToAihara)

  let mejirodaiToHosei: { leaveh: number, leavem: number, arriveh: number, arrivem: number, stList: { h: number, m: number, st: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
  for (const url of busRouteUrls.keio.mejirodaiToHosei) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: false })
    res.forEach(item => mejirodaiToHosei.push({ ...item, station: "mejirodai", isComingToHosei: true, arriveh: -1, arrivem: -1, id: crypto.randomUUID() }))
  }
  for (const bus of mejirodaiToHosei) {
    bus.arriveh = bus.stList.at(-1)?.h as number
    bus.arrivem = bus.stList.at(-1)?.m as number

  }
  let nishihachiojiToHosei: { leaveh: number, leavem: number, arriveh: number, arrivem: number, stList: { h: number, m: number, st: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
  for (const url of busRouteUrls.keio.nishihachiojiToHosei) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: true })
    res.forEach(item => nishihachiojiToHosei.push({ ...item, station: "nishihachioji", isComingToHosei: true, arriveh: -1, arrivem: -1, id: crypto.randomUUID() }))
  }
  for (const bus of nishihachiojiToHosei) {
    bus.arriveh = bus.stList.at(-1)?.h as number
    bus.arrivem = bus.stList.at(-1)?.m as number
  }
  let hoseiToMejirodai: {
    leaveh: number, leavem: number, arriveh: number, arrivem: number, stList: { h: number, m: number, st: string }[], day: string,
    station: string, isComingToHosei: boolean, id: string
  }[] = []
  let hoseiToNishihachioji: {
    leaveh: number, leavem: number, arriveh: number, arrivem: number, stList: { h: number, m: number, st: string }[], day: string,
    station: string, isComingToHosei: boolean, id: string
  }[] = []
  for (const url of busRouteUrls.keio.hoseiTo) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: false })
    res.forEach(item => hoseiToMejirodai.push({ ...item, station: "mejirodai", isComingToHosei: false, arriveh: -1, arrivem: -1, id: crypto.randomUUID() }))
  }
  for (const url of busRouteUrls.keio.hoseiTo) {
    const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: true })
    res.forEach(item => hoseiToNishihachioji.push({ ...item, station: "nishihachioji", isComingToHosei: false, arriveh: -1, arrivem: -1, id: crypto.randomUUID() }))
  }
  for (const bus of hoseiToMejirodai) {
    for (const st of bus.stList) {
      if (st.st === "めじろ台駅") {
        bus.arriveh = st.h
        bus.arrivem = st.m
        break; // Exit after the first iteration
      }
    }
  }
  for (const bus of hoseiToNishihachioji) {
    for (const st of bus.stList) {
      if (st.st === "西八王子駅南口") {
        bus.arriveh = st.h
        bus.arrivem = st.m
        break; // Exit after the first iteration
      }
    }
  }
  const keioTimetable = hoseiToMejirodai
    .concat(hoseiToNishihachioji)
    .concat(mejirodaiToHosei)
    .concat(nishihachiojiToHosei)
    .filter(bus => bus.arriveh)
  const allTimetable = kanachuTimetable.concat(keioTimetable).sort((a, b) => {
    if (a.arriveh * 60 + a.arrivem >= b.arriveh * 60 + a.arrivem) {
      return 1
    } else {
      return -1
    }
  })
  fs.writeFileSync("src/utils/Timetable2.json", JSON.stringify(allTimetable)
}



async function getEkitan({ url }: { url: string }) {
  const days = ["Weekday", "Saturday", "Sunday"]
  const result: { h: number, m: number, trainType: string, destination: string, direction: string, station: string, line: string, day: string }[] = []
  await Promise.all(days.map(async (day, idx) => {
    const dom = await JSDOM.fromURL(`${url}?view=list&dw=${idx}`, {
      referrer: "https://ekitan.com/",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    })
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
        result.push({ h, m, trainType, destination, direction, station, line, day })
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
  const result: {
    h: number;
    m: number;
    trainType: string;
    destination: string;
    direction: string;
    station: string
  }[] = []
  await Promise.all(urls.map(async url => {
    return await getEkitan({ url })
  })).then(item => {
    item.map(i => {
      i.map(j => {
        result.push(j)
      })
    })
  })
  result.map(item => {
    if (item.destination === "京王多摩センターから特急新宿行き行き") {
      item.destination = "新宿行き"
      item.trainType = "各停・京王多摩センターから特急"
    } else if (item.destination === "新線新宿から各駅停車本八幡行き行き") {
      item.destination = "本八幡行き"
      item.trainType = "急行・新線新宿から各停"
    } else if (item.destination === "高幡不動から特急新宿行き行き") {
      item.destination = "新宿行き"
      item.trainType = "各停・高幡不動から特急"
    } else if (item.destination === "高幡不動から急行新宿行き行き") {
      item.destination = "新宿行き"
      item.trainType = "各停・高幡不動から急行"
    }
    if (item.station === "八王子駅" || item.station === "京王八王子駅") {
      item.station = "JR八王子駅/京王八王子駅"
    }
  })

  fs.writeFileSync("src/utils/ekitan.json", JSON.stringify(result, null, 2))

}

getAllTimetables()
// getAllEkitan()

// const result=(await getKanachuTimetable({url:"https://transfer-cloud.navitime.biz/kanachu/courses/timetables?st=00022655&course-sequence=0008000987-22"}))

// const result=(await getKanachustList({url:"https://transfer-cloud.navitime.biz/kanachu/courses/timetables/837b000f/stops?departure-st=00022655-22&course=0008000987&datetime=2026-03-30T19:31:00%2B09:00"}))

// console.table(result)
// console.log(result)