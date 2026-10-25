import React, { useEffect, useState } from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { cn, resolveStationName } from '@/lib/utils'
import { majorStations } from '@/utils/constants'
import { findFutureTrains, findPastTrains, msToTime } from '@/utils/timeHandlers'
import holidayData from "@/utils/Holidays.json"
import { ekitanSchema, type Bus } from '@/utils/types'
import TrainSheet from './ui/TrainSheet'
import * as z from "zod/v4"

// 急行・直行便は経由バス停がわからないので種別と行き先だけ表示する
const expressLabel = (bus: Exclude<Bus, { kind: "regular" }>) =>
  `${bus.kind === "express" ? "急行" : "直行"}${bus.destination === "gym" ? " 体育館行き" : ""}`

type Props = {
  previousBuses: Bus[],
  futureBuses: Bus[],
  timesContainer: React.RefObject<HTMLDivElement | null>
}

const AccordionArea = ({ previousBuses, futureBuses, timesContainer }: Props) => {
  const [ekitanData, setEkitanData] = useState<z.infer<typeof ekitanSchema>>([])
  useEffect(() => {
    import("@/utils/ekitan.json").then(ekitan => {
      // 電車データが壊れていてもバス停一覧は表示したいので、失敗はログだけ残す
      const result = ekitanSchema.safeParse(ekitan.default)
      if (result.success) {
        setEkitanData(result.data)
      } else {
        console.error("ekitan.jsonの形式が正しくありません", result.error)
      }
    })
  }, [])
  return (
    <ScrollArea className="h-96" ref={timesContainer}>
      <Accordion type="single" className="" collapsible>
        {previousBuses.map((item, i) => {
          return (
            <AccordionItem value={i.toString()} className="dark:border-white/50 border-black/20 font-sans font-semibold text-lg md:text-2xl text-center text-black/70 dark:text-white/70" key={i}>
              <AccordionTrigger className="p-2 text-xl">
                <div className="grid grid-cols-2 w-full">
                  <p className="mx-auto">{item ? msToTime(item.leaveHour * 60 + item.leaveMinute) : "?"}</p>
                  <p className="mx-auto">{item.kind === "regular" ? msToTime(item.arriveHour * 60 + item.arriveMinute) : "?"}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="">
                {item.kind === "regular" ? <>
                  {item.stopList.map((stop, idx) => {
                    const trains = [...findPastTrains({
                      date: stop.date, ekitanData: ekitanData, holidayData, station: resolveStationName(stop.name)
                    }),
                    ...findFutureTrains({
                      date: stop.date, ekitanData: ekitanData, holidayData, station: resolveStationName(stop.name)
                    })]
                    return (
                      <div className={cn("border-t last:border-b dark:border-white/20 not-dark:border-black/20",
                        trains.length !== 0 && majorStations.find(j => j === stop.name) ? "p-1 text-lg" : "pt-1 justify-between")} key={idx}>
                        {trains.length !== 0 && majorStations.find(mjrSta => mjrSta === stop.name) ? <TrainSheet
                          trains={trains}
                          h={stop.hour}
                          m={stop.minute}
                          stName={stop.name} /> :
                          <div className='grid grid-cols-3'>
                            <p className="col-span-2">{stop.name}</p>
                            <p className="">{msToTime(stop.hour * 60 + stop.minute)}</p>
                          </div>}
                      </div>
                    )
                  })}</>
                  : <p className='text-lg'>{expressLabel(item)}</p>}
                
              </AccordionContent>
            </AccordionItem>)
        })}
        {futureBuses.map((item, i) => {
          return (
            <AccordionItem value={item.id} className="-my-1 dark:border-white/50 border-black/20 font-sans font-semibold text-3xl md:text-4xl text-center" key={i}>
              <AccordionTrigger className="p-2">
                <div className="grid grid-cols-2 w-full">
                  <p className="mx-auto text-3xl">{item ? msToTime(item.leaveHour * 60 + item.leaveMinute) : "?"}</p>
                  <p className="mx-auto text-3xl">{item.kind === "regular" ? msToTime(item.arriveHour * 60 + item.arriveMinute) : "?"}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="">
                {item.kind === "regular" ? <>{item.stopList.map((st, idx) => {
                  const trains = [...findPastTrains({
                      date: st.date, ekitanData: ekitanData, holidayData, station: resolveStationName(st.name)
                    }),
                    ...findFutureTrains({
                      date: st.date, ekitanData: ekitanData, holidayData, station: resolveStationName(st.name)
                    })]
                  return (
                    <div className={cn("border-t last:border-b dark:border-white/20 not-dark:border-black/20",
                      trains.length !== 0 && majorStations.find(j => j === st.name) ? "p-1 text-lg" : "pt-1")} key={idx}>
                      {trains.length !== 0 && majorStations.find(mjrSta => mjrSta === st.name) ? <TrainSheet trains={trains} h={st.hour} m={st.minute} stName={st.name} /> :
                        <div className='grid grid-cols-3'>
                          <p className="col-span-2">{st.name}</p>
                          <p className="">{msToTime(st.hour * 60 + st.minute)}</p>
                        </div>}
                    </div>
                  )
                })}</> : <p className='text-lg'>{expressLabel(item)}</p>}

              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </ScrollArea>
  )
}

export default AccordionArea