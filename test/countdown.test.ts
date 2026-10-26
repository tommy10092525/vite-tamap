import { describe, expect, it } from "vitest";
import { countdownLabel, minutesUntil } from "../src/utils/timeHandlers";

describe("発車までのカウントダウン", () => {
  it("秒は切り捨てて分の差を返す", () => {
    const now = new Date(2026, 9, 26, 10, 19, 45);
    const date = new Date(2026, 9, 26, 10, 23);
    expect(minutesUntil({ now, date })).toBe(4);
  });

  it("日付をまたいでも分の差を返す", () => {
    const now = new Date(2026, 9, 26, 23, 50);
    const date = new Date(2026, 9, 27, 6, 5);
    expect(minutesUntil({ now, date })).toBe(375);
  });

  it("1分以内はまもなくと表示する", () => {
    expect(countdownLabel(0)).toBe("まもなく");
    expect(countdownLabel(1)).toBe("まもなく");
  });

  it("60分未満は分だけ、60分以上は時間も表示する", () => {
    expect(countdownLabel(2)).toBe("あと2分");
    expect(countdownLabel(59)).toBe("あと59分");
    expect(countdownLabel(60)).toBe("あと1時間");
    expect(countdownLabel(375)).toBe("あと6時間15分");
  });
});
