import * as v from "valibot";

const holidayDataSchema = v.record(
  v.string(),
  v.string())

const daySchema = v.picklist(["Weekday", "Sunday", "Saturday"]);

const stationSchema = v.picklist(["nishihachioji", "mejirodai", "aihara"]);

const busBaseSchema = v.object({
  id: v.string(),
  day: daySchema,
  isComingToHosei: v.boolean(),
  station: stationSchema,
  leaveHour: v.number(),
  leaveMinute: v.number(),
});

// HPから取得できる通常のバス。到着時刻と経由バス停が必ずある。
// TimeTable.jsonにはkindが無いので、パース時に"regular"を補う。
const regularBusSchema = v.object({
  ...busBaseSchema.entries,
  kind: v.optional(v.literal("regular"), "regular"),
  arriveHour: v.number(),
  arriveMinute: v.number(),
  stopList: v.array(
    v.object({
      hour: v.number(),
      minute: v.number(),
      name: v.string()
    })
  ),
});

// 大学のPDFでのみ時刻がわかる急行・直行便。発車時刻しかわからない。
// validFrom/validToは"YYYY-MM-DD"（両端を含む）。validToが無い場合は終わりなし。
const expressBusSchema = v.object({
  ...busBaseSchema.entries,
  kind: v.picklist(["express", "direct"]),
  destination: v.picklist(["campus", "gym"]),
  validFrom: v.string(),
  validTo: v.optional(v.string()),
});

const timetableEntrySchema = v.variant("kind", [
  regularBusSchema,
  expressBusSchema,
]);

// TimeTable.json（通常便のみ）
const timetableSchema = v.array(regularBusSchema);

const timeStringSchema = v.pipe(v.string(), v.regex(/^\d{1,2}:\d{2}$/));

// ExpressTimetable.json
const expressTimetableSchema = v.array(
  v.object({
    kind: v.picklist(["express", "direct"]),
    station: stationSchema,
    isComingToHosei: v.boolean(),
    day: daySchema,
    validFrom: v.string(),
    validTo: v.optional(v.string()),
    departures: v.array(
      v.union([
        timeStringSchema,
        v.object({
          time: timeStringSchema,
          destination: v.picklist(["campus", "gym"]),
        }),
      ])
    ),
  })
);

const datedStopSchema = v.object({
  date: v.date(),
  hour: v.number(),
  minute: v.number(),
  name: v.string(),
});

const BusSchema = v.variant("kind", [
  v.object({
    ...regularBusSchema.entries,
    date: v.date(),
    stopList: v.array(datedStopSchema),
  }),
  v.object({
    ...expressBusSchema.entries,
    date: v.date(),
  }),
])



const ekitanSchema=v.array(
  v.object({
    day: daySchema,
    station: v.picklist([
      "西八王子駅",
      "めじろ台駅",
      "相原駅",
      "JR八王子駅/京王八王子駅",
      "橋本駅",
    ]),
    trainType:v.string(),
    destination:v.string(),
    direction:v.string(),
    line:v.string(),
    hour: v.number(),
    minute: v.number(),
  })
)

const stateSchema = v.object({
  station: stationSchema,
  isComingToHosei: v.boolean(),
})

export type Bus = v.InferOutput<typeof BusSchema>
export type RegularBus = Extract<Bus, { kind: "regular" }>
export type TimetableEntry = v.InferOutput<typeof timetableEntrySchema>
export type RegularTimetableEntry = v.InferOutput<typeof regularBusSchema>
export type ExpressTimetableEntry = v.InferOutput<typeof expressBusSchema>
export type TrainWithDate = v.InferOutput<typeof ekitanSchema>[number] & { date: Date }

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
