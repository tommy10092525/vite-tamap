import { describe, expect, it } from "vitest";

import ekitan from "../src/utils/ekitan.json";
import { ekitanSchema } from "../src/utils/types";

describe("ekitan.json の形式", () => {
  // スクレイパーの出力とスキーマがずれると、アプリでは電車データが読めなくなる
  it("ekitanSchema に一致する", () => {
    const result = ekitanSchema.safeParse(ekitan);
    expect(result.error?.issues.slice(0, 3)).toBeUndefined();
  });
});
