import { it, describe, expect } from "vitest";
import { getEkitan } from "../scraping";
import { resumeToPipeableStream } from "react-dom/server";

describe("駅探 ", async () => {
  it("getekitan 京王八王子", async () => {
    const trainTypes = new Set<string>();
    const destinations=new Set<string>();
    const result = await getEkitan({
      url: "https://ekitan.com/timetable/railway/line-station/262-31/d1",
    });
    result.map((item) => {
      trainTypes.add(item.trainType);
      destinations.add(item.destination)
    });
    expect(result).not.toBeUndefined();
    expect(result.length).not.toBe(0);
    console.log(trainTypes);
    console.log(destinations);
  });

  it("getekitan 慶応橋本", async () => {
    const trainTypes = new Set<string>();
    const destinations=new Set<string>();
    const result = await getEkitan({
      url: "https://ekitan.com/timetable/railway/line-station/261-11/d1",
    });
    result.map((item) => {
      trainTypes.add(item.trainType);
      destinations.add(item.destination)
    });
    expect(result).not.toBeUndefined();
    expect(result.length).not.toBe(0);
    console.log(trainTypes);
    console.log(destinations);
  });

  it.skip("えきたん 列車種別", async () => {
    const urls = [
      "https://ekitan.com/timetable/railway/line-station/163-16/d1",
      "https://ekitan.com/timetable/railway/line-station/264-3/d1",
      "https://ekitan.com/timetable/railway/line-station/180-22/d1",
      "https://ekitan.com/timetable/railway/line-station/180-21/d1",
      "https://ekitan.com/timetable/railway/line-station/163-19/d1",
      "https://ekitan.com/timetable/railway/line-station/25-0/d1",
      "https://ekitan.com/timetable/railway/line-station/110-17/d1",
      "https://ekitan.com/timetable/railway/line-station/163-15/d1",
      "https://ekitan.com/timetable/railway/line-station/261-11/d1",
      "https://ekitan.com/timetable/railway/line-station/262-31/d1",
    ];
    const trainTypes = new Set<string>();

    const result = await Promise.all(
      urls.map(async (url) => {
        return getEkitan({ url });
      }),
    );
    result.flat(2).map(({trainType,line})=>{
      trainTypes.add(`${line}:${trainType}`)
    })
    console.log(trainTypes)
  });
});
