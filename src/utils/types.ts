type HolidayData={date:string,holiday:string}[]
type Timetable={
  day:"weekday"|"Sunday"|"Saturday",
  isComingToHosei:boolean,
  station:string,
  leaveHour:number,
  leaveMinute:number,
  arriveHour:number,
  arriveMinute:number,
  otherInforMation:string
}[]
type State={
  station:string,
  isComingToHosei:boolean,
  menuOpened:boolean
}


export type{HolidayData,Timetable,State}