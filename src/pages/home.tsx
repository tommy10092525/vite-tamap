import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { findNextBuses, keioRapid, msToTime } from "@/utils/timeHandlers";
import { buildings, stationNames } from "@/utils/constants";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import holidayDataJSON from "@/utils/Holidays.json";
import Menu from "@/components/menu";
import {
  timetableSchema,
  holidayDataSchema,
  stateSchema,
  stationSchema,
} from "@/utils/types";

import tamapLogo from "@/images/tamap_logo.webp";
import mapImage from "@/images/Map.webp";
import AccordionArea from "@/components/accordion-area";
import useUserInput from "@/utils/useUserInput";
import * as z from "zod/v4";
import Clock from "@/components/ui/Clock";
import TamapHowToInstall from "@/components/tamap-how-to-install";
import { ArrowsCounterClockwiseIcon } from "@phosphor-icons/react";
import DiscountLink from "@/components/discount-link";
import { cn } from "@/lib/utils";

import { Tabs } from "@base-ui/react/tabs"
import { Button } from "@/components/ui/button";
import HoseiLink from "@/components/HoseiLink";
import LastEdited from "@/components/last-edited";

gsap.registerPlugin(useGSAP);

const Card = ({ children, className }: { children: ReactNode, className?: string }) => {
  return <div className={cn("dark:bg-black/50 bg-white/20 rounded-xl p-2 w-full", className)}>
    {children}
  </div>
}

export default function Home() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setInterval(() => {
      if (now.getMinutes() !== new Date().getMinutes()) {
        setNow(new Date())
      }
    }, 1000);
  }, []);

  const [timetable, setTimetable] = useState<z.infer<typeof timetableSchema>>(
    [],
  );
  useEffect(() => {
    import("@/utils/TimeTable_5_5_18_59.json").then((timetable) => {
      setTimetable(keioRapid({ now, timetable: timetableSchema.parse(timetable.default) }));
    });
  }, []);

  const holidayData = useMemo(() => holidayDataSchema.parse(holidayDataJSON), []);

  const animateArrows = useGSAP().contextSafe(() => {
    gsap.fromTo(
      "[data-arrows]",
      { rotate: 0 },
      { rotate: 180, duration: 0.3 },
    );
  });
  const animateDirectionButton = useGSAP().contextSafe(() => {
    gsap.fromTo(
      "[data-arrowscontainer]",
      { scale: 1.05, opacity: 0.5 },
      { scale: 1, duration: 0.3, opacity: 1 },
    );
  });
  const timesContainer = useRef(null);
  const directionContainer = useRef(null);
  const times = {
    economics: useRef(null),
    health: useRef(null),
    gym: useRef(null),
    sport: useRef(null),
  };
  const animateText = useGSAP().contextSafe(() => {
    gsap.fromTo(
      Object.values(times).map((ref) => ref.current),
      { opacity: 0, y: 5 },
      { y: 0, duration: 0.3, opacity: 1, stagger: 0.01 },
    );
  });
  const { setState, state } = useUserInput();



  useEffect(() => {
    localStorage.setItem("station", state.station);
    localStorage.setItem(
      "isComingToHosei",
      state.isComingToHosei ? "true" : "false",
    );
  }, [state.station, state.isComingToHosei]);

  const handleDirectionButtonClicked = () => {
    setState((prev) => {
      return stateSchema.parse({
        ...prev,
        isComingToHosei: !prev.isComingToHosei,
      });
    });
    gsap.fromTo(
      timesContainer.current,
      { opacity: 0, y: 10 },
      { y: 0, duration: 0.3, opacity: 1, stagger: 0.01 },
    );
  };

  const handleStationButtonClicked = (
    station: z.infer<typeof stationSchema>,
  ) => {
    setState((prev) => {
      return stateSchema.parse({
        ...prev,
        station,
      });
    });
  };

  useGSAP(() => {
    animateText();
  }, [state.isComingToHosei, state.station]);

  useGSAP(() => {
    animateDirectionButton();
    animateArrows();
    gsap.fromTo(
      directionContainer.current,
      { rotateY: 180, autoAlpha: 0 },
      { rotateY: 0, duration: 0.3, autoAlpha: 1 },
    );
  }, [state.isComingToHosei]);

  useGSAP(() => {
    if (state.isComingToHosei) {
      gsap.fromTo(
        "[data-departure]",
        { y: -20, autoAlpha: 0 },
        { y: 0, duration: 0.3, autoAlpha: 1 },
      );
    } else {
      gsap.fromTo(
        "[data-arrival]",
        { y: -20, autoAlpha: 0 },
        { y: 0, duration: 0.3, autoAlpha: 1 },
      );
    }
  }, [state.station]);

  let departure = "";
  let destination = "";
  const overlay = {
    economics: "--:--",
    health: "--:--",
    sport: "--:--",
    gym: "--:--",
  };
  const previousBuses = findNextBuses({
    timetable,
    station: state.station,
    isComingToHosei: state.isComingToHosei,
    holidayData: holidayData,
    currentDate: now,
    length: -2,
  });

  const futureBuses = findNextBuses({
    timetable,
    station: state.station,
    isComingToHosei: state.isComingToHosei,
    holidayData: holidayData,
    currentDate: now,
    length: 3,
  });

  console.log(futureBuses)

  const [nextBus] = futureBuses;
  departure = stationNames[state.station];
  destination = "法政大学";
  if (!state.isComingToHosei) {
    [departure, destination] = [destination, departure];
  }
  if (state.isComingToHosei && nextBus && nextBus.arriveHour && nextBus.arriveMinute) {
    overlay.economics = msToTime(
      nextBus.arriveHour * 60 + nextBus.arriveMinute + buildings.economics,
    );
    overlay.health = msToTime(
      nextBus.arriveHour * 60 + nextBus.arriveMinute + buildings.health,
    );
    overlay.sport = msToTime(
      nextBus.arriveHour * 60 + nextBus.arriveMinute + buildings.sport,
    );
    overlay.gym = msToTime(
      nextBus.arriveHour * 60 + nextBus.arriveMinute + buildings.gym,
    );
  }

  const overlayStyles = "absolute backdrop-blur-sm rounded-lg w-1/3 h-16";
  const tabsStyles = "transition-all text-lg h-8 font-medium data-[active]:text-white  dark:data-[active]:text-black dark:text-white"

  return (
    <>
      <title>たまっぷ - 法政大学多摩キャンパス向けバス時刻アプリ</title>
      <meta
        name="description"
        content="法政大学多摩キャンパスと最寄り駅（西八王子、めじろ台、相原）を結ぶバスの時刻表をリアルタイムで確認できます。次のバスの発車時刻や、各学部棟への到着時刻もわかります。"
      />
      {/* 宣材 */}
      <Menu />
      <div className="bg-linear-210 dark:from-blue-500 dark:to-orange-500 from-sky-400 to-orange-300 p-3 md:p-7 w-full min-h-screen text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black" data-container >


        {/* 時計 */}
        <Clock />



        <div
          className="gap-3 flex items-center flex-col mx-auto p-3 max-w-2xl touch-manipulation"
          data-main
        >
        <HoseiLink />
        <img
          alt="たまっぷのロゴ"
          src={tamapLogo}
          className="md:col-span-1 mx-auto -my-8 w-60 h-60"
          fetchPriority="high"
        />
          {/* <NewSNS /> */}
          {/* 一つ目のカード */}
          <Card>
            {/* 行先表示 */}
            <div
              className="grid grid-cols-5 mx-auto mt-5 px-8 font-semibold text-xl text-center"
              ref={directionContainer}
            >
              <p
                className="inline-block col-span-2 h-8 text-center"
                data-departure
              >
                {departure}
              </p>
              <p className="col-span-1 h-4">⇒</p>
              <p
                className="inline-block col-span-2 h-8 text-center"
                data-arrival
              >
                {destination}
              </p>
            </div>
            {/* 時刻一覧 */}
            <AccordionArea
              previousBuses={previousBuses}
              futureBuses={futureBuses}
              timesContainer={timesContainer}
            />
            <div className="flex gap-2 mt-3">
              <Button
                className="flex shadow-xl mx-auto rounded-lg w-1/2 not-dark:text-white dark:text-black text-center bg-black dark:bg-white"
                onClick={() => {
                  handleDirectionButtonClicked();
                }}
                data-arrowscontainer
              >

                <ArrowsCounterClockwiseIcon
                  // ref={arrowsRef}
                  data-arrows
                  className="ml-3 rotate-x-180 size-6"
                />
                {/* <Repeat  ref={arrowsRef} className="size-7 mt-[8px] ml-3"/> */}
                <span className="mx-auto my-2 font-semibold text-lg text-center">
                  左右切替
                </span>
              </Button>
              {/*<Button type="button" className=""><Link to={"/question"}>「？」表記について</Link></Button>*/}
            </div>

          </Card>

          <Tabs.Root className="rounded-xl w-full" defaultValue={"nishihachioji"} onValueChange={value => {
            const prev = ["nishihachioji", "mejirodai", "aihara"].indexOf(state.station)
            const next = ["nishihachioji", "mejirodai", "aihara"].indexOf(value)
            let direction = 0
            if (prev > next) {
              direction = -1
            } else {
              direction = 1
            }
            gsap.fromTo(
              timesContainer.current,
              { opacity: 0, x: 20 * direction },
              { x: 0, duration: 0.5, opacity: 1, stagger: 0.01 },
            );
            handleStationButtonClicked(value)

          }} value={state.station}>
            <Tabs.List className="relative z-0 gap-1 px-1 bg-white/20 dark:bg-stone-950/60 grid grid-cols-3 rounded-xl p-2.5">
              <Tabs.Tab
                className={tabsStyles}
                value="nishihachioji"
              >
                西八王子
              </Tabs.Tab>
              <Tabs.Tab
                className={tabsStyles}
                value="mejirodai"
              >
                めじろ台
              </Tabs.Tab>
              <Tabs.Tab
                className={tabsStyles}
                value="aihara"
              >
                相原
              </Tabs.Tab>
              <Tabs.Indicator className="absolute top-1/2 left-0 z-[-1] h-10 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] -translate-y-1/2 rounded-md bg-black dark:bg-white transition-all duration-200 ease-in-out" />
            </Tabs.List>
          </Tabs.Root>


          {/* 二つ目のカード */}
          <Card>
            <div className="relative font-semibold text-lg text-center">
              <img
                src={mapImage}
                alt="地図のイラスト"
                width={300}
                className="mx-auto h-48 object-cover"
                height={300}
              />
              <Card className={cn("top-0 left-0", overlayStyles)}>
                経済
                <span className="block" ref={times.economics}>
                  {overlay.economics}
                </span>
              </Card>
              <Card className={cn("top-0 right-0", overlayStyles)}>
                社・現福
                <span className="block" ref={times.health}>
                  {overlay.health}
                </span>
              </Card>
              <Card className={cn("bottom-0 left-0", overlayStyles)}>
                体育館
                <span className="block" ref={times.gym}>
                  {overlay.gym}
                </span>
              </Card>
              <Card className={cn("right-0 bottom-0", overlayStyles)}>
                スポ健康
                <span className="block" ref={times.sport}>
                  {overlay.sport}
                </span>
              </Card>
            </div>
          </Card>


          {/* 割引ボタン */}
          <TamapHowToInstall />

          {new Date() < new Date("2026/4/1") && <DiscountLink />}

          {/* <TamasaiThanks /> */}
        </div>
        <p className="mx-auto mt-2 font-medium text-black text-center">
          時刻は目安であり、交通状況等による変わる可能性があります。
          <br />
          また臨時便等には対応しておりません。
        </p>
        <p className="text-black text-center">©CODE MATES︎</p>
        <div className="text-black"></div>
      </div>
      <LastEdited/>
    </>
  );
}
