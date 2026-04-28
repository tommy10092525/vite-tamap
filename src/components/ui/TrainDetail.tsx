import { typeColor } from '@/utils/color';


type Props = {
  trainType: string;
  destination: string;
  direction: string;
  line: string;
  h: number;
  m: number;
  idx:number;
}

const TrainDetail = ({ destination,
  idx,
  h,
  line,
  m,
  trainType }: Props) => {
  return (
    <div className='p-1 text-[10px] dark:text-white text-black md:text-xs border-b border-b-black/20 dark:border-b-white/20 ml-2'>
      <div className='flex gap-1'>
        {idx===0?<p className='text-2xl'>({h}:{m.toString().padStart(2, "0")})</p>:
        <p className='text-2xl'>{h}:{m.toString().padStart(2, "0")}</p>
        }
      </div>
      <div className='flex gap-1'>
        <p className={`rounded-xs p-1 text-center ${typeColor({ line: line, trainType: trainType }).lineStyles}`}>{line}</p>
        <p className={`rounded-xs p-1 ${typeColor({ line: line, trainType: trainType }).trainTypeStyles}`}>{trainType}</p>
        <p className='p-1'>{destination}</p>
      </div>
    </div>
  )
}

export default TrainDetail