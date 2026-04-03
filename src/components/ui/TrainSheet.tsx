import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { msToTime } from '@/utils/timeHandlers';
import { type TrainWithDate } from '@/utils/types';
import { TrainIcon } from 'lucide-react';
import TrainDetail from './TrainDetail';
import { ScrollArea } from "./scroll-area";
type Props = {
  trains: TrainWithDate[],
  h: number,
  m: number,
  stName: string
}

const TrainSheet = (props: Props) => {
  const date = props.trains[0].date
  return (
    <Sheet>
      <SheetTrigger className='flex justify-between dark:bg-white not-dark:bg-black p-1 rounded-md w-full dark:text-black not-dark:text-white selection:bg-black dark:selection:bg-white'>
        <p>
          <TrainIcon size={30} className='text-center' />
        </p>
        <p>{props.trains[0].station}・{props.stName}</p>
        <p>{msToTime(props.h * 60 + props.m)}</p>
      </SheetTrigger>
      <SheetContent side="left" className='bg-white/70 dark:bg-black/70 backdrop-blur-lg border-white/10 dark:text-white not-dark:text-black h-[100vh] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black'>
        <SheetHeader className=''>
          <SheetTitle className="text-center">{props.trains[0].station} {date.getMonth() + 1}/{date.getDate()} {date.getHours()}:{date.getMinutes().toString().padStart(2, "0")}</SheetTitle>
          <SheetDescription>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="">
          <div className="h-[calc(100vh-80px)]">
          {props.trains.map((train, i) => (
            <TrainDetail key={i} idx={i} destination={train.destination} direction={train.direction} h={train.h} m={train.m} line={train.line} trainType={train.trainType} />
          ))}

          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export default TrainSheet