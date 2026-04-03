import fs from "fs"

import t from "./src/utils/Timetable.json"

const tt={nishihachioji:[],mejirodai:[],aihara:[]};

t.map(item=>{
  const station=item.station
  delete item.station
  
  const bus=Object.values(item)
  switch(station){
    case "nishihachioji":
      tt.nishihachioji.push(bus)
      break
    case "mejirodai":
      tt.mejirodai.push(bus)
      break
    case "aihara":
      tt.aihara.push(bus)
      break
    default:

  }
})

fs.writeFileSync("src/utils/Timetable2.json", JSON.stringify(tt))