import React from 'react'
import { ScrollArea } from './ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { cn } from '../lib/utils'
import { majorStations } from '../utils/constants'
import { minutesToTime } from '../utils/timeHandlers'
import type { Timetable } from '../utils/types'

type Props = {
  previousBuses: Timetable,
  futureBuses: Timetable,
  timesContainer: React.RefObject<HTMLDivElement|null>
}

const AccordionArea = ({ previousBuses, futureBuses, timesContainer }: Props) => {
  return (
    <ScrollArea className="h-96" ref={timesContainer}>
      <Accordion type="single" className="" collapsible>
        {previousBuses.map((item, i) => {
          return (
            <AccordionItem value={item.id} className="opacity-70 dark:border-white/50 border-black/20 font-sans font-semibold text-lg md:text-2xl text-center" key={i}>
              <AccordionTrigger className="p-2 text-xl">
                <p className="mx-auto">{minutesToTime(item.leaveHour * 60 + item.leaveMinute)}</p>
                <p className="mx-auto">{minutesToTime(item.arriveHour * 60 + item.arriveMinute)}</p>
              </AccordionTrigger>
              <AccordionContent className="">
                {item.busStopList.map(bStp => {
                  return (
                    <div className={cn("grid grid-cols-3 border-t last:border-b dark:border-white/20 not-dark:border-black/20",
                      majorStations.find(j => j === bStp.busStop) ? "p-1 text-lg" : "pt-1")}>
                      <p className={cn("col-span-2", majorStations.find(mjrSta => mjrSta === bStp.busStop) ? "m-1 border dark:border-white/30 dark:bg-white/20 rounded-md not-dark:border-black/20 not-dark:bg-black/5" : "-my-1")}>{bStp.busStop}</p>
                      <p className="my-auto">{minutesToTime(bStp.hour * 60 + bStp.minute)}</p>
                    </div>
                  )
                })}
              </AccordionContent>
            </AccordionItem>)
        })}
        {futureBuses.map((item, i) => {
          return (
            <AccordionItem value={item.id} className="-my-1 dark:border-white/50 border-black/20 font-sans font-semibold text-3xl md:text-4xl text-center" key={i}>
              <AccordionTrigger className="p-2">
                <p className="mx-auto text-3xl">{item ? minutesToTime(item.leaveHour * 60 + item.leaveMinute) : "--:--"}</p>
                <p className="mx-auto text-3xl">{item ? minutesToTime(item.arriveHour * 60 + item.arriveMinute) : "--:--"}</p>
              </AccordionTrigger>
              <AccordionContent className="">{item.busStopList.map(busStop => {
                return (
                  <div className={cn("grid grid-cols-3 border-t last:border-b dark:border-white/20 not-dark:border-black/20", majorStations.find(majorSt => majorSt === busStop.busStop) ? "text-lg" : "")}>
                    <p className={cn("col-span-2", majorStations.find(majorSt => majorSt === busStop.busStop) ? "dark:bg-white/20 not-dark:bg-black/10 border not-dark:border-black/20 rounded-md m-1" : "")}>{busStop.busStop}</p>
                    <p className={cn(majorStations.find(majorSt => majorSt === busStop.busStop) ? "text-2xl mt-1" : "-my-1 text-lg")}>{minutesToTime(busStop.hour * 60 + busStop.minute)}</p>
                  </div>
                )
              })}</AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </ScrollArea>
  )
}

export default AccordionArea