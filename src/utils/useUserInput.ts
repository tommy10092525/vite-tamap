import { useEffect, useState } from "react";
import { stateSchema, stationSchema } from "./types";
import * as v from "valibot"

export default function useUserInput() {
  const [state, setState] = useState<v.InferOutput<typeof stateSchema>>({ isComingToHosei: true, station: "nishihachioji" })
  useEffect(()=>{
    if (localStorage.getItem("firstAccessed")) {
      try {
        const station = v.parse(stationSchema, localStorage.getItem("station"))
        const isComingToHosei = localStorage.getItem("isComingToHosei") === "true"
        setState(() => {
          return { station, isComingToHosei }
        })
      } catch (e) {
        console.error("Invalide localStorage data:", e)
      }
    }else{
      localStorage.setItem("firstAccessed","false")
    }
  },[])
  return { state, setState }
}