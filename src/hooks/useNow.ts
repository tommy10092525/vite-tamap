import {useEffect, useState} from "react"

// precisionが"minute"のときは分が変わったときだけ再描画する
export const useNow=(precision:"second"|"minute"="second")=>{
  const [now,setNow]=useState(new Date())
  useEffect(()=>{
    const id=setInterval(()=>{
      const next=new Date()
      setNow(prev=>
        precision==="minute" &&
        Math.floor(prev.getTime()/60000)===Math.floor(next.getTime()/60000)
          ? prev
          : next
      )
    },1000)
    return ()=>clearInterval(id)
  },[precision])
  return {now}
}
