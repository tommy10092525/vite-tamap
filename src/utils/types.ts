import * as z from "zod/v4";

const holidayDataSchema = z.record(
  z.string(),
  z.string())

const daySchema = z.union([
  z.literal("Weekday"),
  z.literal("Sunday"),
  z.literal("Saturday"),
]);

const stationSchema = z.union([
  z.literal("nishihachioji"),
  z.literal("mejirodai"),
  z.literal("aihara"),
]);

const busBaseSchema = z.object({
  id: z.string(),
  day: daySchema,
  isComingToHosei: z.boolean(),
  station: stationSchema,
  leaveHour: z.number(),
  leaveMinute: z.number(),
});

// HPから取得できる通常のバス。到着時刻と経由バス停が必ずある。
// TimeTable.jsonにはkindが無いので、パース時に"regular"を補う。
const regularBusSchema = busBaseSchema.extend({
  kind: z.literal("regular").default("regular"),
  arriveHour: z.number(),
  arriveMinute: z.number(),
  stopList: z.array(
    z.object({
      hour: z.number(),
      minute: z.number(),
      name: z.string()
    })
  ),
});

// 大学のPDFでのみ時刻がわかる急行・直行便。発車時刻しかわからない。
// validFrom/validToは"YYYY-MM-DD"（両端を含む）。validToが無い場合は終わりなし。
const expressBusSchema = busBaseSchema.extend({
  kind: z.union([z.literal("express"), z.literal("direct")]),
  destination: z.union([z.literal("campus"), z.literal("gym")]),
  validFrom: z.string(),
  validTo: z.string().optional(),
});

const timetableEntrySchema = z.discriminatedUnion("kind", [
  regularBusSchema,
  expressBusSchema,
]);

// TimeTable.json（通常便のみ）
const timetableSchema = z.array(regularBusSchema);

const timeStringSchema = z.string().regex(/^\d{1,2}:\d{2}$/);

// ExpressTimetable.json
const expressTimetableSchema = z.array(
  z.object({
    kind: z.union([z.literal("express"), z.literal("direct")]),
    station: stationSchema,
    isComingToHosei: z.boolean(),
    day: daySchema,
    validFrom: z.string(),
    validTo: z.string().optional(),
    departures: z.array(
      z.union([
        timeStringSchema,
        z.object({
          time: timeStringSchema,
          destination: z.union([z.literal("campus"), z.literal("gym")]),
        }),
      ])
    ),
  })
);

const datedStopSchema = z.object({
  date: z.date(),
  hour: z.number(),
  minute: z.number(),
  name: z.string(),
});

const BusSchema = z.discriminatedUnion("kind", [
  regularBusSchema.extend({
    date: z.date(),
    stopList: z.array(datedStopSchema),
  }),
  expressBusSchema.extend({
    date: z.date(),
  }),
])



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
    hour: z.number(),
    minute: z.number(),
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

export type Bus = z.infer<typeof BusSchema>
export type RegularBus = Extract<Bus, { kind: "regular" }>
export type TimetableEntry = z.infer<typeof timetableEntrySchema>
export type RegularTimetableEntry = z.infer<typeof regularBusSchema>
export type ExpressTimetableEntry = z.infer<typeof expressBusSchema>
export type TrainWithDate = z.infer<typeof ekitanSchema>[number] & { date: Date }

export {
  holidayDataSchema,
  timetableSchema,
  timetableEntrySchema,
  expressTimetableSchema,
  stationSchema,
  stateSchema,
  ekitanSchema,
  BusSchema,
};