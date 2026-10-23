import {describe,it,expect} from "vitest"
import { busRouteURLs, getKanachuBusStopList, getKanachuBusUrls, getKeioBusStopList, getKeioBusUrls } from "../scraping";

describe.skip("時刻表取得関数の挙動が正しいかどうか検証します", async() => {
  
  it("京王バス　バス停取得 単体 https://transfer.navitime.biz/bus-navi/pc/diagram/BusRouteTimetable?operation=822d001a&datetime=2026-10-25T14%3A32%3A00&node=00021279&course=0000456026&stop-no=1",async()=>{
    const result=await getKeioBusStopList("https://transfer.navitime.biz/bus-navi/pc/diagram/BusRouteTimetable?operation=822d001a&datetime=2026-10-25T14%3A32%3A00&node=00021279&course=0000456026&stop-no=1")
    expect(result.stopList.length).not.toBe(0)
  })
  
  it("めじろ台→法政　バス停の長さが0ではない", async() => { 
    await Promise.all(busRouteURLs.keio.mejirodaiToHosei.map(async url=>{
      const urls=await getKeioBusUrls({url,ignoreMejirodaiOnly:false})
      expect(urls.length).toBeGreaterThan(0)
      urls.map(({url})=>{
        const result=getKeioBusStopList(url)
        result.then(data=>{
          expect(data.stopList.length).not.toBe(0)
        })
      })
    }))
  });

  it("神奈中バス バス停取得 単体",async()=>{
    const stopList=await getKanachuBusStopList("https://transfer-cloud.navitime.biz/kanachu/courses/timetables/81890001/stops?departure-busstop=00022822-1&course=0008002246&datetime=2026-10-23T06:05:00%2B09:00")
    expect(stopList.stopList.length).not.toBe(0)
  })

  it("神奈中バス URL取得 単体",async()=>{
    const urls=await getKanachuBusUrls("https://transfer-cloud.navitime.biz/kanachu/courses/timetables?busstop=00022822&course-sequence=0008000984-1")
    expect(urls.length).not.toBe(0)
  })

  it.skip("神奈中バス　URL取得 全体",async()=>{
    await Promise.all(busRouteURLs.kanachu.aiharaTo.map(async url=>{
      const result=await getKanachuBusUrls(url)
      expect(result.length).not.toBe(0)
    }))
    await Promise.all(busRouteURLs.kanachu.hoseiTo.map(async url=>{
      const result=await getKanachuBusUrls(url)
      expect(result.length).not.toBe(0)
    }))
  })

  it("相原→法政　バス停の長さが0ではない", async () => {
    await Promise.all(busRouteURLs.kanachu.aiharaTo.map(async url=>{
      const urls=await getKanachuBusUrls(url)
      expect(urls.length).toBeGreaterThan(0)
      console.log(urls.length)
      urls.map(({url})=>{
        const result=getKanachuBusStopList(url)
        result.then(data=>{
          expect(data.stopList.length).not.toBe(0)
        })
      })
    }))
  });



});
