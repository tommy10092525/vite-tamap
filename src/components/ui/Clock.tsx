import { useEffect, useState } from 'react'
import { getDateString, getTimeString } from '../../utils/timeHandlers'

const Clock = () => {
  const [, setNow] = useState(new Date())
  useEffect(()=>{
    setInterval(() => {
      setNow(new Date())
    },1000);
  },[])
  return (
    <div className="top-3 left-3 z-10 fixed bg-white/70 dark:bg-black/60 shadow backdrop-blur-sm p-5 rounded-full w-1/3 text-black dark:text-white">
      <p suppressHydrationWarning={false} className="w-auto h-7 font-medium text-lg text-center">{getDateString()}</p>
      {/* <p suppressHydrationWarning={false} className="w-auto h-7 font-mono text-lg text-center">{(() => {
        return dayIndices[new Date().getDay()]
      })()}</p> */}
      <p suppressHydrationWarning={false} className="w-auto h-7 font-medium text-2xl text-center">{getTimeString()}</p>
    </div>
  )
}

export default Clock