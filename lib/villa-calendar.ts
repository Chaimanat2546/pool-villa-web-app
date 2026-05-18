export type {
  VillaCalendarDayStatus,
  VillaCalendarDay,
  VillaCalendarMonth,
  VillaCalendarDayDetail,
} from "./villa-calendar-types";

import { existsSync } from "node:fs";
import { createClient } from "@/lib/supabase/server";
import type {
  VillaCalendarDayStatus,
  VillaCalendarMonth,
  VillaCalendarDayDetail,
} from "./villa-calendar-types";

type Browser = import("puppeteer-core").Browser;
type Page = import("puppeteer-core").Page;
type Chromium = typeof import("@sparticuz/chromium").default;

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
const internalCalendarCache = new Map<
  string,
  { expiresAt: number; payload: VillaCalendarMonth }
>();
const internalDayCache = new Map<
  string,
  { expiresAt: number; payload: VillaCalendarDayDetail | null }
>();

type InternalAccommodationRow = {
  id: string;
  status: string;
  pricing?:
    | {
        normal_price: number | string | null;
      }
    | null
    | undefined;
  weekday_prices?:
    | Array<{
        weekday: number | null;
        price: number | string | null;
      }>
    | null
    | undefined;
  capacity?:
    | {
        guest_capacity: number | null;
      }
    | null
    | undefined;
};

type InternalDatePriceRow = {
  stay_date: string;
  price_type: "special" | "holiday" | "pending" | "booked";
  price: number | string | null;
  agency_price: number | string | null;
  note: string | null;
  is_active: boolean;
};

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

function getInternalCalendarCacheKey(accommodationId: string, offset: number) {
  return `internal:${accommodationId}:${offset}`;
}

function getInternalDayCacheKey(
  accommodationId: string,
  offset: number,
  day: number,
) {
  return `internal:${accommodationId}:${offset}:${day}`;
}

function toOptionalNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: number | string | null | undefined) {
  const parsed = toOptionalNumber(value);

  return parsed === null
    ? null
    : `THB ${Math.round(parsed).toLocaleString()}`;
}

function getMonthStart(offset: number) {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function getMonthEnd(offset: number) {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getWeekdayPrice(
  weekdayPrices: InternalAccommodationRow["weekday_prices"],
  weekday: number,
) {
  if (!weekdayPrices) return null;

  const match = weekdayPrices.find((item) => item.weekday === weekday);

  return match?.price ?? null;
}

async function getInternalAccommodationPricing(accommodationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodations")
    .select(
      `
      id,
      status,
      pricing:accommodation_pricing(normal_price),
      weekday_prices:accommodation_weekday_prices(
        weekday,
        price
      ),
      capacity:accommodation_capacity(guest_capacity)
    `,
    )
    .eq("id", accommodationId)
    .eq("status", "published")
    .maybeSingle<InternalAccommodationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

async function getInternalDatePrices(
  accommodationId: string,
  startDate: string,
  endDate: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accommodation_date_prices")
    .select(
      "stay_date, price_type, price, agency_price, note, is_active",
    )
    .eq("accommodation_id", accommodationId)
    .eq("is_active", true)
    .gte("stay_date", startDate)
    .lte("stay_date", endDate)
    .returns<InternalDatePriceRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

function getExistingBrowserPath(paths: Array<string | undefined>) {
  return paths.find((path) => path && existsSync(path)) || null;
}

async function getBrowserExecutablePath(chromium: Chromium) {
  const localBrowserPath = getExistingBrowserPath([
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_EXECUTABLE_PATH,
    process.env.GOOGLE_CHROME_BIN,
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    process.env.PROGRAMFILES
      ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    process.env["PROGRAMFILES(X86)"]
      ? `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
  ]);

  if (localBrowserPath) {
    return localBrowserPath;
  }

  const chromiumPath = await chromium.executablePath();

  if (chromiumPath && existsSync(chromiumPath)) {
    return chromiumPath;
  }

  throw new Error(
    "Unable to find a browser executable for villa calendar scraping. Set PUPPETEER_EXECUTABLE_PATH or install Chrome/Chromium.",
  );
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
      const executablePath = await getBrowserExecutablePath(chromium);

      return puppeteer.launch({
        args: await puppeteer.defaultArgs({
          args: chromium.args,
          headless,
        }),
        defaultViewport: {
          width: 1280,
          height: 720,
        },
        executablePath,
        headless,
      });
    })().catch((error) => {
      browserPromise = null;
      throw error;
    });
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

export async function getInternalVillaCalendarMonth(
  accommodationId: string,
  offset: number,
): Promise<VillaCalendarMonth> {
  const cacheKey = getInternalCalendarCacheKey(accommodationId, offset);
  const cached = internalCalendarCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const monthStart = getMonthStart(offset);
  const monthEnd = getMonthEnd(offset);
  const [pricing, datePrices] = await Promise.all([
    getInternalAccommodationPricing(accommodationId),
    getInternalDatePrices(
      accommodationId,
      formatDateKey(monthStart),
      formatDateKey(monthEnd),
    ),
  ]);

  if (!pricing) {
    throw new Error("Accommodation not found.");
  }

  const firstDayIndex = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const datePriceMap = new Map(
    datePrices.map((price) => [price.stay_date, price]),
  );

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      day,
    );
    const dateKey = formatDateKey(date);
    const datePrice = datePriceMap.get(dateKey);
    let status: VillaCalendarDayStatus = "available";

    if (date < today) {
      status = "disabled";
    } else if (datePrice?.price_type === "booked") {
      status = "booked";
    } else if (datePrice?.price_type === "pending") {
      status = "pending";
    } else if (datePrice?.price_type === "holiday") {
      status = "holiday";
    } else if (datePrice?.price_type === "special") {
      status = "special";
    }

    return { day, status };
  });

  const payload = {
    month: formatMonthLabel(monthStart),
    firstDayIndex,
    days,
    offset,
  } satisfies VillaCalendarMonth;

  internalCalendarCache.set(cacheKey, {
    expiresAt: Date.now() + CALENDAR_TTL_MS,
    payload,
  });

  return payload;
}

export async function getInternalVillaCalendarDayDetail(
  accommodationId: string,
  offset: number,
  day: number,
): Promise<VillaCalendarDayDetail | null> {
  const cacheKey = getInternalDayCacheKey(accommodationId, offset, day);
  const cached = internalDayCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const monthStart = getMonthStart(offset);
  const date = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    day,
  );
  const dateKey = formatDateKey(date);

  const [pricing, datePrices] = await Promise.all([
    getInternalAccommodationPricing(accommodationId),
    getInternalDatePrices(accommodationId, dateKey, dateKey),
  ]);

  if (!pricing) {
    throw new Error("Accommodation not found.");
  }

  const datePrice = datePrices[0] ?? null;
  const normalPrice = pricing.pricing?.normal_price ?? null;
  const weekdayPrice = getWeekdayPrice(pricing.weekday_prices, date.getDay());
  const statusOnly =
    datePrice?.price_type === "pending" || datePrice?.price_type === "booked";
  const price = statusOnly
    ? null
    : datePrice?.price ?? weekdayPrice ?? normalPrice;
  const detail: VillaCalendarDayDetail = {
    title: `Day ${day}`,
    price: formatPrice(price) ?? undefined,
    type:
      datePrice?.price_type === "booked"
        ? "Booked"
        : datePrice?.price_type === "pending"
          ? "Pending"
          : datePrice?.price_type === "holiday"
            ? "Holiday"
            : datePrice?.price_type === "special"
              ? "Special"
              : "Standard",
    capacity:
      pricing.capacity?.guest_capacity !== null &&
      pricing.capacity?.guest_capacity !== undefined
        ? `${pricing.capacity.guest_capacity} guests`
        : undefined,
  };

  internalDayCache.set(cacheKey, {
    expiresAt: Date.now() + DAY_TTL_MS,
    payload: detail,
  });

  return detail;
}
