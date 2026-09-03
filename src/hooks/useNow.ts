import {useEffect, useState} from "react"

export const useNow=()=>{
  const [now,setNow]=useState(new Date())
  useEffect(()=>{
    setInterval(()=>{
      setNow(new Date())
    },1000)
  },[])
  return {now}
}