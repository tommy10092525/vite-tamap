type HolidayData=Record<string,string>
type Timetable={
  id:string,
  day:string,
  isComingToHosei:boolean,
  station:string,
  leaveHour:number,
  leaveMinute:number,
  arriveHour:number,
  arriveMinute:number,
  busStopList:{
    hour:number,
    minute:number,
    busStop:string
  }[]
}[]
type State={
  station:string,
  isComingToHosei:boolean,
}


export type{HolidayData,Timetable,State}