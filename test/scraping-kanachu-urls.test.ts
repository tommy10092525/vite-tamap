import { describe, expect, it } from "vitest";

import { parseKanachuBusUrls } from "../scraping";

const page = (rows: string) => `<table><tbody>${rows}</tbody></table>`;

describe("parseKanachuBusUrls", () => {
  it("1つのセルに複数の便があってもすべて取得する", () => {
    const html = page(`
      <tr><th><div>15</div></th>
        <td><a href="/a/1530">30</a><a href="/a/1540">40</a></td>
        <td><a href="/a/s1510">10</a></td>
        <td></td>
      </tr>
      <tr><th><div>16</div></th>
        <td><a href="/a/1610">10</a><a href="/a/1615">15</a><a href="/a/1645">45</a></td>
        <td></td>
        <td><a href="/a/h1620">20</a><a href="/a/h1650">50</a></td>
      </tr>`);
    const urls = parseKanachuBusUrls(html);
    expect(urls.filter(({ day }) => day === "Weekday").map(({ url }) => url)).toEqual([
      "https://transfer-cloud.navitime.biz/a/1530",
      "https://transfer-cloud.navitime.biz/a/1540",
      "https://transfer-cloud.navitime.biz/a/1610",
      "https://transfer-cloud.navitime.biz/a/1615",
      "https://transfer-cloud.navitime.biz/a/1645",
    ]);
    expect(urls.filter(({ day }) => day === "Saturday")).toHaveLength(1);
    expect(urls.filter(({ day }) => day === "Sunday")).toHaveLength(2);
  });

  it("◎の付いた便だけを除外する（リンク内のsup）", () => {
    const html = page(`
      <tr><td><a href="/a/1"><sup>◎</sup>05</a><a href="/a/2">20</a><a href="/a/3"><sup>急</sup>40</a></td></tr>`);
    expect(parseKanachuBusUrls(html).map(({ url }) => url)).toEqual([
      "https://transfer-cloud.navitime.biz/a/2",
      "https://transfer-cloud.navitime.biz/a/3",
    ]);
  });

  it("◎の付いた便だけを除外する（リンクの直後・囲み要素内のsup）", () => {
    const html = page(`
      <tr><td>
        <a href="/a/1">05</a><sup>◎</sup>
        <a href="/a/2">20</a>
        <div><a href="/a/3">40</a><span><sup>◎</sup></span></div>
        <div><a href="/a/4">50</a></div>
      </td></tr>`);
    expect(parseKanachuBusUrls(html).map(({ url }) => url)).toEqual([
      "https://transfer-cloud.navitime.biz/a/2",
      "https://transfer-cloud.navitime.biz/a/4",
    ]);
  });
});
