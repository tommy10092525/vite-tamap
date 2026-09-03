import { getDateString, getTimeString, isHoliday } from '@/utils/timeHandlers'
import holidayData from '@/utils/Holidays.json'
import { useNow } from '@/hooks/useNow'


const Clock = () => {
  const {now}=useNow()
  return (
    <div className='top-3 left-3 fixed w-auto p-4 z-10 dark:bg-black/50 bg-white/20 rounded-xl'>
      <p suppressHydrationWarning={false} className="w-auto h-7 font-medium text-lg text-center">{getDateString(now)}</p>
      <p suppressHydrationWarning={false} className="w-auto h-7 font-medium text-2xl text-center">{getTimeString(now)}</p>
      {isHoliday({ date: now, holidayData }) && <div><p className='text-red-500 text-center'>{isHoliday({ date: now, holidayData })}</p></div>}
    </div>
  )
}

export default Clock