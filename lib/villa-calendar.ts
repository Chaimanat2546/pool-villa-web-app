export type {
  VillaCalendarDayStatus,
  VillaCalendarDay,
  VillaCalendarMonth,
  VillaCalendarDayDetail,
} from "./villa-calendar-types";

import type {
  VillaCalendarDayStatus,
  VillaCalendarMonth,
  VillaCalendarDayDetail,
} from "./villa-calendar-types";

type Browser = import("puppeteer-core").Browser;
type Page = import("puppeteer-core").Page;

const VILLA_CALENDAR_BASE_URL = "https://www.pattayapartypoolvilla.com/v";
const CALENDAR_SELECTOR = "#calendarBooking";
const MONTH_SELECTOR = `${CALENDAR_SELECTOR} .text-xl.font-bold`;
const DAY_CELL_SELECTOR = `${CALENDAR_SELECTOR} .grid.grid-cols-7.w-full > div`;
const CALENDAR_TTL_MS = 1000 * 60 * 5;
const DAY_TTL_MS = 1000 * 60 * 5;
const MAX_OFFSET = 12;
let browserPromise: Promise<Browser> | null = null;
const calendarCache = new Map<
  string,
  { expiresAt: number; payload: VillaCalendarMonth }
>();
const dayCache = new Map<
  string,
  { expiresAt: number; payload: VillaCalendarDayDetail | null }
>();

export function clampVillaCalendarOffset(value: number) {
  return Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, value));
}

export function parseVillaCalendarOffset(value: string | null) {
  const parsed = Number(value || "0");

  return Number.isFinite(parsed) ? clampVillaCalendarOffset(parsed) : 0;
}

export function parseVillaCalendarDay(value: string | null) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 31
    ? parsed
    : null;
}

function getCalendarCacheKey(villaId: string, offset: number) {
  return `${villaId}:${offset}`;
}

function getDayCacheKey(villaId: string, offset: number, day: number) {
  return `${villaId}:${offset}:${day}`;
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
        import("puppeteer-core"),
        import("@sparticuz/chromium"),
      ]);
      const headless = "shell";

      chromium.setGraphicsMode = false;

      return puppeteer.launch({
        args: await puppeteer.defaultArgs({
          args: chromium.args,
          headless,
        }),
        defaultViewport: {
          width: 1280,
          height: 720,
        },
        executablePath: await chromium.executablePath(),
        headless,
      });
    })();
  }

  return browserPromise;
}

async function openCalendarPage(villaId: string, offset: number) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.goto(
    `${VILLA_CALENDAR_BASE_URL}/${encodeURIComponent(villaId)}`,
    {
      waitUntil: "networkidle2",
      timeout: 30000,
    },
  );

  await page.waitForSelector(CALENDAR_SELECTOR, {
    timeout: 10000,
  });

  await moveCalendarOffset(page, offset);

  return page;
}

async function moveCalendarOffset(page: Page, offset: number) {
  if (offset === 0) return;

  for (let index = 0; index < Math.abs(offset); index++) {
    const oldMonth = await page.$eval(
      MONTH_SELECTOR,
      (element: Element) => element.textContent?.trim() || "",
    );
    const buttons = await page.$$(`${CALENDAR_SELECTOR} button`);
    let targetButton = null;

    for (const button of buttons) {
      const text = await page.evaluate(
        (element: Element) => element.textContent?.trim() || "",
        button,
      );

      if (offset > 0 && text.includes("Next")) {
        targetButton = button;
        break;
      }

      if (offset < 0 && text.includes("Prev")) {
        targetButton = button;
        break;
      }
    }

    if (!targetButton) {
      throw new Error("Calendar navigation button not found.");
    }

    await targetButton.click();
    await page.waitForFunction(
      (previousMonth: string) => {
        const element = document.querySelector("#calendarBooking .text-xl.font-bold");

        return element?.textContent?.trim() !== previousMonth;
      },
      { timeout: 10000 },
      oldMonth,
    );
  }
}

export async function getVillaCalendarMonth(
  villaId: string,
  offset: number,
): Promise<VillaCalendarMonth> {
  const cacheKey = getCalendarCacheKey(villaId, offset);
  const cached = calendarCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const page = await openCalendarPage(villaId, offset);

  try {
    const month = await page.$eval(
      MONTH_SELECTOR,
      (element: Element) => element.textContent?.trim() || "",
    );
    const firstDayIndex = await page.$$eval(DAY_CELL_SELECTOR, (elements: Element[]) => {
      let count = 0;

      for (const element of elements) {
        const text = (element.textContent || "").trim();

        if (/^\d+/.test(text)) break;

        count++;
      }

      return count;
    });
    const days = await page.$$eval(DAY_CELL_SELECTOR, (elements: Element[]) => {
      const seen = new Map<number, VillaCalendarDayStatus>();
      const statusRank: Record<VillaCalendarDayStatus, number> = {
        disabled: 0,
        available: 1,
        holiday: 2,
        pending: 3,
        booked: 4,
        special: 5,
      };

      for (const element of elements) {
        const text = (element.textContent || "").trim();
        const match = text.match(/\d+/);

        if (!match) continue;

        const day = Number(match[0]);
        const className = element.className;
        let status: VillaCalendarDayStatus = "available";
        const specialText = `${text} ${(element as HTMLElement).innerHTML || ""}`;

        if (/พิเศษ|โปร|special|promo/i.test(specialText)) {
          status = "special";
        } else if (typeof className === "string" && className.includes("bg-rose-500")) {
          status = "booked";
        } else if (typeof className === "string" && className.includes("bg-emerald-500")) {
          status = "pending";
        } else if (typeof className === "string" && className.includes("bg-amber-200")) {
          status = "holiday";
        } else if (
          typeof className === "string" &&
          className.includes("bg-slate-50") &&
          className.includes("cursor-not-allowed")
        ) {
          status = "disabled";
        }

        const existing = seen.get(day);

        if (!existing || statusRank[status] > statusRank[existing]) {
          seen.set(day, status);
        }
      }

      return Array.from(seen, ([day, status]) => ({ day, status })).sort(
        (a, b) => a.day - b.day,
      );
    });
    const payload = {
      month,
      firstDayIndex,
      days,
      offset,
    };

    calendarCache.set(cacheKey, {
      expiresAt: Date.now() + CALENDAR_TTL_MS,
      payload,
    });

    return payload;
  } finally {
    await page.close();
  }
}

export async function getVillaCalendarDayDetail(
  villaId: string,
  offset: number,
  day: number,
) {
  const cacheKey = getDayCacheKey(villaId, offset, day);
  const cached = dayCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const page = await openCalendarPage(villaId, offset);

  try {
    const cells = await page.$$(DAY_CELL_SELECTOR);
    let clicked = false;

    for (const cell of cells) {
      const text = await page.evaluate(
        (element: Element) => element.textContent?.trim() || "",
        cell,
      );
      const match = text.match(/\d+/);

      if (match && Number(match[0]) === day) {
        await cell.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      return null;
    }

    try {
      await page.waitForSelector(".fixed.inset-0.bg-black\\/50", {
        timeout: 5000,
      });
    } catch {
      return null;
    }

    const detail = await page.evaluate(() => {
      const modal = document.querySelector(".fixed.inset-0.bg-black\\/50");

      if (!modal) return null;

      const text = modal.textContent || "";
      const title = modal.querySelector("h3")?.textContent?.trim() || "";
      const price = text.match(/\d{1,3}(,\d{3})*\s*บาท/)?.[0] || "";
      const capacity = text.match(/\d+\s*คน/)?.[0] || "";
      let type = "";
      const spans = Array.from(modal.querySelectorAll("span"));

      for (const span of spans) {
        const spanText = span.textContent?.trim() || "";

        if (/ราคาปกติ|ราคาพิเศษ|โปรโมชั่น/.test(spanText)) {
          type = spanText;
          break;
        }
      }

      return {
        title,
        price,
        type,
        capacity,
      };
    });

    dayCache.set(cacheKey, {
      expiresAt: Date.now() + DAY_TTL_MS,
      payload: detail,
    });

    return detail;
  } finally {
    await page.close();
  }
}
