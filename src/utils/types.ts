import * as z from "zod/v4";

const holidayDataSchema = z.record(
  z.string(),
  z.string())

const timetableSchema = z.array(
  z.object({
    id: z.string(),
    day: z.union([
      z.literal("Weekday"),
      z.literal("Sunday"),
      z.literal("Saturday"),
    ]),
    isComingToHosei: z.boolean(),
    station: z.union([
      z.literal("nishihachioji"),
      z.literal("mejirodai"),
      z.literal("aihara"),
    ]),
    leaveHour: z.number(),
    leaveMinute: z.number(),
    arriveHour: z.number(),
    arriveMinute: z.number(),
    busStopList: z.array(
      z.object({
        hour: z.number(),
        minute: z.number(),
        busStop: z.string()
      })
    )
  })
)


const stateSchema = z.object({
  station: z.union([
    z.literal("nishihachioji"),
    z.literal("mejirodai"),
    z.literal("aihara"),
  ]),
  isComingToHosei: z.boolean(),
})

const stationSchema = z.union([
  z.literal("nishihachioji"),
  z.literal("mejirodai"),
  z.literal("aihara"),
]);



export { holidayDataSchema, timetableSchema, stationSchema ,stateSchema};