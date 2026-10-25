import React, { memo, useEffect, useMemo, useState } from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { cn, resolveStationName } from '@/lib/utils'
import { majorStations } from '@/utils/constants'
import { findFutureTrains, findPastTrains, msToTime } from '@/utils/timeHandlers'
import holidayData from "@/utils/Holidays.json"
import { ekitanSchema, type Bus, type RegularBus } from '@/utils/types'
import TrainSheet from './ui/TrainSheet'
import * as v from "valibot"

type EkitanData = v.InferOutput<typeof ekitanSchema>

// 急行・直行便は経由バス停がわからないので種別と行き先だけ表示する
const expressLabel = (bus: Exclude<Bus, { kind: "regular" }>) =>
  `${bus.kind === "express" ? "急行" : "直行"}${bus.destination === "gym" ? " 体育館行き" : ""}`

// AccordionContentは閉じている間は中身を描画しないので、電車の検索は開いたときだけ行われる
const StopRow = ({ stop, ekitanByStation }: {
  stop: RegularBus["stopList"][number],
  ekitanByStation: Map<string, EkitanData>
}) => {
  const isMajorStation = majorStations.includes(stop.name)
  const trains = useMemo(() => {
    if (!isMajorStation) {
      return []
    }
    const station = resolveStationName(stop.name)
    const ekitanData = ekitanByStation.get(station) ?? []
    // findPastTrains/findFutureTrainsは引数のdateを書き換えるのでコピーを渡す
    return [
      ...findPastTrains({ date: new Date(stop.date), ekitanData, holidayData, station }),
      ...findFutureTrains({ date: new Date(stop.date), ekitanData, holidayData, station }),
    ]
  }, [isMajorStation, stop.name, stop.date, ekitanByStation])
  const showTrains = trains.length !== 0
  return (
    <div className={cn("border-t last:border-b dark:border-white/20 not-dark:border-black/20",
      showTrains ? "p-1 text-lg" : "pt-1")}>
      {showTrains ? <TrainSheet trains={trains} h={stop.hour} m={stop.minute} stName={stop.name} /> :
        <div className='grid grid-cols-3'>
          <p className="col-span-2">{stop.name}</p>
          <p className="">{msToTime(stop.hour * 60 + stop.minute)}</p>
        </div>}
    </div>
  )
}

const BusDetail = ({ bus, ekitanByStation }: { bus: Bus, ekitanByStation: Map<string, EkitanData> }) =>
  bus.kind === "regular"
    ? <>{bus.stopList.map((stop, idx) => <StopRow stop={stop} ekitanByStation={ekitanByStation} key={idx} />)}</>
    : <p className='text-lg'>{expressLabel(bus)}</p>

type Props = {
  previousBuses: Bus[],
  futureBuses: Bus[],
  timesContainer: React.RefObject<HTMLDivElement | null>
}

const AccordionArea = ({ previousBuses, futureBuses, timesContainer }: Props) => {
  const [ekitanData, setEkitanData] = useState<EkitanData>([])
  useEffect(() => {
    import("@/utils/ekitan.json").then(ekitan => {
      // 電車データが壊れていてもバス停一覧は表示したいので、失敗はログだけ残す
      const result = v.safeParse(ekitanSchema, ekitan.default)
      if (result.success) {
        setEkitanData(result.output)
      } else {
        console.error("ekitan.jsonの形式が正しくありません", result.issues)
      }
    })
  }, [])
  // 停留所ごとの検索で毎回全件を走査しないよう、駅ごとに分けておく
  const ekitanByStation = useMemo(() => {
    const map = new Map<string, EkitanData>()
    ekitanData.forEach(item => {
      const list = map.get(item.station)
      if (list) {
        list.push(item)
      } else {
        map.set(item.station, [item])
      }
    })
    return map
  }, [ekitanData])
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
                <BusDetail bus={item} ekitanByStation={ekitanByStation} />
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
                <BusDetail bus={item} ekitanByStation={ekitanByStation} />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </ScrollArea>
  )
}

export default memo(AccordionArea)
