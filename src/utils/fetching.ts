import { timetableApi,holidayDataAPi } from "./constants";

const timetableFetcher=async ()=>{
  const response=await fetch(timetableApi)
  const data=await response.json()
  return data
}

const holidayDataFetcher=async()=>{
  const response=await fetch(holidayDataAPi)
  const data=await response.json()
  console.log(data)
  return data
}

export {timetableFetcher,holidayDataFetcher}