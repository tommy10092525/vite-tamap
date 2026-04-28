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
    arriveHour: z.number().optional(),
    arriveMinute: z.number().optional(),
    stopList: z.array(
      z.object({
        hour: z.number(),
        minute: z.number(),
        name: z.string()
      })
    ),
    gym:z.boolean().optional()
  })
)


const BusSchema = timetableSchema.element.extend({
  date: z.date(),
  stopList: z.array(z.object({
    date: z.date(),
    hour: z.number(),
    minute: z.number(),
    name: z.string(),
  })),
})



const ekitanSchema=z.array(
  z.object({
    day: z.union([
      z.literal("Weekday"),
      z.literal("Sunday"),
      z.literal("Saturday"),
    ]),
    station: z.union([
      z.literal("西八王子駅"),
      z.literal("めじろ台駅"),
      z.literal("相原駅"),
      z.literal("JR八王子駅/京王八王子駅"),
      z.literal("橋本駅"),
    ]),
    trainType:z.string(),
    destination:z.string(),
    direction:z.string(),
    line:z.string(),
    h: z.number(),
    m: z.number(),
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



export type Bus = z.infer<typeof BusSchema>
export type TrainWithDate = z.infer<typeof ekitanSchema>[number] & { date: Date }

export { holidayDataSchema, timetableSchema, stationSchema, stateSchema, ekitanSchema, BusSchema };