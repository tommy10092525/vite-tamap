import { JSDOM } from "jsdom"
import * as z from "zod"
import fs from "fs"


function compareTime(a: { hour: number, minute: number }, b: { hour: number, minute: number }) {
    if (a.hour * 60 + a.minute > b.hour * 60 + b.minute) {
        return 1
    } else {
        return -1
    }
}

async function getKeioBusStops({ url }: { url: string }) {
    try {
        const dom = await JSDOM.fromURL(url);
        const document = dom.window.document
        const trs = [...document.querySelectorAll("#railroad-matrix>center>div")]
        const busStops = trs.map(tr => {
            // console.log(tr.querySelector("span")?.textContent)
            const hour = parseInt(z.string().parse((tr.querySelector("span")?.textContent.match(/(\d{2}:)/)?.[0].slice(0, 2))))
            const minute = parseInt(z.string().parse(tr.querySelector("span")?.textContent.match(/(:\d{2})/)?.[0].slice(1, 3)))

            const busStop = z.string().parse(tr.querySelector("strong")?.textContent?.replace(/[\n\r\t]/g, "").trim())
            return { hour, minute, busStop }
        })
        return busStops
    } catch (e) {
        console.log({ url })
        throw e
    }
}

async function getKeioTimeTable({ url, ignoreMejirodaiOnly }: { url: string, ignoreMejirodaiOnly: boolean }) {
    const wkDict = { wkd: "Weekday", std: "Saturday", snd: "Sunday" }
    try {
        const dom = await JSDOM.fromURL(url);
        const document = dom.window.document;
        const trs = [...document.querySelectorAll("tr.l2")]
        const urls: { url: string, leaveHour: number, leaveMinute: number, day: string }[] = []
        trs.map(tr => {
            const r = tr.querySelector("th.hour")?.textContent?.replace(/[\n\r\t]/g, "")
            let leaveHour = -1
            if (r) {
                leaveHour = parseInt(r)
            } else {
                console.error("")
            }
            for (const week in wkDict) {
                const day = tr.querySelector(`td.${week}`)
                const items = [...day?.querySelectorAll("div.diagram-item") || []]
                for (const item of items) {
                    if (item.querySelector("div.top")?.textContent.indexOf("グ") != -1 && !ignoreMejirodaiOnly || item.querySelector("div.top")?.textContent.indexOf("め") == -1) {
                        const time = item.querySelector("span[aria-hidden='true']")
                        let leaveMinute = -1
                        if (time) {
                            leaveMinute = parseInt(time.textContent)
                        }
                        const url = "https://transfer.navitime.biz" + item.querySelector("a")?.getAttribute("href")
                        console.log({ url, leaveHour, leaveMinute, day: wkDict[week as keyof typeof wkDict] })
                        urls.push({ url, leaveHour, leaveMinute, day: wkDict[week as keyof typeof wkDict] })
                    }
                }
            }
        })
        const results = await Promise.all(urls.map(async ({ url, leaveHour, leaveMinute, day }) => {
            const busStops = await getKeioBusStops({ url })
            return { leaveHour, leaveMinute, busStops, day }
        }))
        return results
    } catch (e) {
        console.log({ url })
        throw e
        return []
    }
}

async function getKanachuTimetable({ url }: { url: string }) {
    const data = await fetch(url)
    const text = await data.text()
    const dom = new JSDOM(text);
    const document = dom.window.document;
    const trs = [...document.querySelectorAll("tr.row1")].concat([...document.querySelectorAll("tr.row2")]);
    const urls: { url: string, leaveHour: number, leaveMinute: number, day: string }[] = []
    const days = ["Weekday", "Saturday", "Sunday"]
    for (const tr of trs) {
        const leaveHour = tr.querySelector("th.hour")?.textContent?.replace(/[\n\r\t]/g, "")
        const tds = [...tr.querySelectorAll("td")];
        tds.map((td, index) => {
            const aTags = [...td.querySelectorAll("a")];
            aTags.map(aTag => {
                const url = "https://www.kanachu.co.jp" + aTag.getAttribute("href")
                const leaveMinute = aTag.textContent?.replace(/[\n\r\t]/g, "")
                if (leaveHour && leaveMinute && url) {
                    urls.push({ url, leaveHour: parseInt(leaveHour), leaveMinute: parseInt(leaveMinute), day: days[index] })
                }
            })
        })
    }
    const results = await Promise.all(urls.map(async ({ url, leaveHour, leaveMinute, day }) => {
        const busStops = await getKanachuBusStops({ url })
        return { leaveHour, leaveMinute, busStops, day }
    }))
    return results
}

async function getKanachuBusStops({ url }: { url: string }) {
    const data = await fetch(url)
    const text = await data.text()
    // console.log({url,text})
    const dom = new JSDOM(text);
    const document = dom.window.document;
    const busStops: { hour: number, minute: number, busStop: string }[] = []
    const trs = [...document.querySelectorAll("ul.routeList")]
    for (const tr of trs) {
        const lis = [...tr.querySelectorAll("li")]
        for (const li of lis) {

            const [hour, minute] = li.querySelector("a")?.textContent?.slice(0, 5).split(":").map(s => parseInt(s)) || [-1, -1]
            if(hour===undefined||minute===undefined){
                console.log(li.querySelector("a")?.textContent)
                console.log({hour,minute,url})
                // throw new Error("Failed to parse time")
                continue
            }
            const busStop = z.string().parse(li.querySelector("span.busStopPoint")?.textContent?.replace(/[\n\r\t]/g, "").trim())
            busStops.push({ hour, minute, busStop })

        }
    }
    return busStops
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
            ["https://www.kanachu.co.jp/dia/diagram/timetable/cs:0000802900-1/nid:00130397/rt:0/k:%E7%9B%B8%E5%8E%9F%E9%A7%85%E8%A5%BF%E5%8F%A3",
                "https://www.kanachu.co.jp/dia/diagram/timetable/cs:0000803034-12/nid:00130397/rt:0/k:%E6%B3%95%E6%94%BF%E5%A4%A7%E5%AD%A6%EF%BC%88%E7%94%BA%E7%94%B0%E5%B8%82%EF%BC%89",
            ],
        "hoseiTo":
            ["https://www.kanachu.co.jp/dia/diagram/timetable/cs:0000802289-1/nid:00021279/rt:0/k:%E6%B3%95%E6%94%BF%E5%A4%A7%E5%AD%A6%EF%BC%88%E7%94%BA%E7%94%B0%E5%B8%82%EF%BC%89",
                "https://www.kanachu.co.jp/dia/diagram/timetable/cs:0000803723-1/nid:00021279/dts:1750186800",
                "https://www.kanachu.co.jp/dia/diagram/timetable/cs:0000803039-6/nid:00021279/dts:1750186800"]
    }
}

async function getAllTimetables() {
    let aiharaToHosei: { leaveHour: number, leaveMinute: number, arriveHour: number, arriveMinute: number, busStops: { hour: number, minute: number, busStop: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
    for (const url of busRouteUrls.kanachu.aiharaTo) {
        const res = await getKanachuTimetable({ url })
        res.forEach(item => aiharaToHosei.push({ ...item, station: "aihara", isComingToHosei: true, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    const hoseiToAihara: { leaveHour: number, leaveMinute: number, arriveHour: number, arriveMinute: number, busStops: { hour: number, minute: number, busStop: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
    for (const url of busRouteUrls.kanachu.hoseiTo) {
        const res = await getKanachuTimetable({ url })
        res.forEach(item => hoseiToAihara.push({ ...item, station: "aihara", isComingToHosei: false, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const bus of aiharaToHosei) {
        for (const busStop of bus.busStops) {
            // Do something with busStop
            bus.arriveHour = busStop.hour
            bus.arriveMinute = busStop.minute
            break; // Exit after the first iteration
        }
    }
    aiharaToHosei = structuredClone(aiharaToHosei).filter(bus => bus.arriveHour)
    for (const bus of hoseiToAihara) {
        for (const busStop of bus.busStops) {
            if (busStop.busStop === "相原駅西口") {
                bus.arriveHour = busStop.hour
                bus.arriveMinute = busStop.minute
                break; // Exit after the first iteration
            }
        }
    }
    const kanachuTimetable = aiharaToHosei.concat(hoseiToAihara)

    let mejirodaiToHosei: { leaveHour: number, leaveMinute: number, arriveHour: number, arriveMinute: number, busStops: { hour: number, minute: number, busStop: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
    for (const url of busRouteUrls.keio.mejirodaiToHosei) {
        const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: false })
        res.forEach(item => mejirodaiToHosei.push({ ...item, station: "mejirodai", isComingToHosei: true, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const bus of mejirodaiToHosei) {
        for (const busStop of bus.busStops) {
            bus.arriveHour = busStop.hour
            bus.arriveMinute = busStop.minute
            break; // Exit after the first iteration
        }
    }
    let nishihachiojiToHosei: { leaveHour: number, leaveMinute: number, arriveHour: number, arriveMinute: number, busStops: { hour: number, minute: number, busStop: string }[], day: string, station: string, isComingToHosei: boolean, id: string }[] = []
    for (const url of busRouteUrls.keio.nishihachiojiToHosei) {
        const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: true })
        res.forEach(item => nishihachiojiToHosei.push({ ...item, station: "nishihachioji", isComingToHosei: true, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const bus of nishihachiojiToHosei) {
        for (const busStop of bus.busStops) {
            bus.arriveHour = busStop.hour
            bus.arriveMinute = busStop.minute
            break; // Exit after the first iteration
        }
    }
    let hoseiToMejirodai: {
        leaveHour: number, leaveMinute: number, arriveHour: number, arriveMinute: number, busStops: { hour: number, minute: number, busStop: string }[], day: string,
        station: string, isComingToHosei: boolean, id: string
    }[] = []
    let hoseiToNishihachioji: {
        leaveHour: number, leaveMinute: number, arriveHour: number, arriveMinute: number, busStops: { hour: number, minute: number, busStop: string }[], day: string,
        station: string, isComingToHosei: boolean, id: string
    }[] = []
    for (const url of busRouteUrls.keio.hoseiTo) {
        const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: false })
        res.forEach(item => hoseiToMejirodai.push({ ...item, station: "mejirodai", isComingToHosei: false, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const url of busRouteUrls.keio.hoseiTo) {
        const res = await getKeioTimeTable({ url, ignoreMejirodaiOnly: true })
        res.forEach(item => hoseiToNishihachioji.push({ ...item, station: "nishihachioji", isComingToHosei: false, arriveHour: -1, arriveMinute: -1, id: crypto.randomUUID() }))
    }
    for (const bus of hoseiToMejirodai) {
        for (const busStop of bus.busStops) {
            if (busStop.busStop === "めじろ台駅") {
                bus.arriveHour = busStop.hour
                bus.arriveMinute = busStop.minute
                break; // Exit after the first iteration
            }
        }
    }
    for (const bus of hoseiToNishihachioji) {
        for (const busStop of bus.busStops) {
            if (busStop.busStop === "西八王子駅南口") {
                bus.arriveHour = busStop.hour
                bus.arriveMinute = busStop.minute
                break; // Exit after the first iteration
            }
        }
    }
    const keioTimetable = hoseiToMejirodai.concat(hoseiToNishihachioji).concat(mejirodaiToHosei).concat(nishihachiojiToHosei).filter(bus => bus.arriveHour)
    console.log({ keioTimetable })
    console.log({ kanachuTimetable })
    const allTimetable = kanachuTimetable.concat(keioTimetable)
    console.log({ allTimetable })
    const timetableSchema = z.array(
        z.object({
            id: z.string(),
            day: z.union([
                z.literal("Weekday"),
                z.literal("Sunday"),
                z.literal("Saturday"),
            ]),
            isComingToHosei: z.boolean(),
            station: z.union([
                z.literal("nishihachioji"),
                z.literal("mejirodai"),
                z.literal("aihara"),
            ]),
            leaveHour: z.number(),
            leaveMinute: z.number(),
            arriveHour: z.number(),
            arriveMinute: z.number(),
            busStops: z.array(
                z.object({
                    hour: z.number(),
                    minute: z.number(),
                    busStop: z.string()
                })
            )
        })
    )
    timetableSchema.parse(allTimetable)
    fs.writeFileSync("src/utils/Timetable.json", JSON.stringify(allTimetable))
}

getAllTimetables()