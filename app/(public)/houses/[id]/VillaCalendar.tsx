"use client";

import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type {
  VillaCalendarDay,
  VillaCalendarDayDetail,
  VillaCalendarDayStatus,
} from "@/lib/villa-calendar-types";

type VillaCalendarProps = {
  villaId: string;
};

type CalendarResponse = {
  data?: {
    month: string;
    first_day_index: number;
    days: VillaCalendarDay[];
    offset: number;
  };
  error?: string;
};

type DayDetailResponse = {
  data?: {
    detail?: VillaCalendarDayDetail | null;
  };
  error?: string;
};

const WEEK_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const STATUS_LABELS: Record<VillaCalendarDayStatus, string> = {
  available: "วันว่าง",
  booked: "ติดจองแล้ว",
  pending: "มีจองแล้ว รอโอน",
  holiday: "วันหยุด",
  special: "ราคาพิเศษ",
  disabled: "วันที่ผ่านมาแล้ว",
};

async function readApiResponse<T>(response: Response) {
  const body = (await response.json().catch(() => null)) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.");
  }

  return body;
}

function getDayClassName(status: VillaCalendarDayStatus) {
  const base =
    "relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-md border text-sm font-semibold transition";

  if (status === "special") {
    return `${base} border-orange-500 bg-orange-500 text-white hover:bg-orange-600`;
  }

  if (status === "booked") {
    return `${base} cursor-not-allowed border-rose-500 bg-rose-500 text-white`;
  }

  if (status === "pending") {
    return `${base} border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600`;
  }

  if (status === "holiday") {
    return `${base} border-amber-300 bg-amber-100 text-slate-800 hover:bg-amber-200`;
  }

  if (status === "disabled") {
    return `${base} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400`;
  }

  return `${base} border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50`;
}

function StatusSwatch({ status }: { status: VillaCalendarDayStatus }) {
  const className =
    status === "special"
      ? "bg-orange-500"
      : status === "booked"
        ? "bg-rose-500"
        : status === "pending"
          ? "bg-emerald-500"
          : status === "holiday"
            ? "bg-amber-100"
            : status === "disabled"
              ? "bg-slate-100"
              : "bg-white";

  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-sm border border-slate-300 ${className}`}
      aria-hidden="true"
    />
  );
}

export function VillaCalendar({ villaId }: VillaCalendarProps) {
  const [days, setDays] = useState<VillaCalendarDay[]>([]);
  const [month, setMonth] = useState("");
  const [firstDayIndex, setFirstDayIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<VillaCalendarDayStatus | null>(null);
  const [detail, setDetail] = useState<VillaCalendarDayDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchCalendar = useCallback(async () => {
    const response = await fetch(
      `/api/villa-calendar?id=${encodeURIComponent(villaId)}&offset=${offset}`,
      { cache: "no-store" },
    );

    return readApiResponse<CalendarResponse>(response);
  }, [villaId, offset]);

  useEffect(() => {
    let isActive = true;

    async function loadCalendar() {
      setIsLoading(true);
      setError(null);

      try {
        const body = await fetchCalendar();
        const calendar = body.data;

        if (!isActive) return;

        setDays(calendar?.days ?? []);
        setMonth(calendar?.month ?? "");
        setFirstDayIndex(calendar?.first_day_index ?? 0);
      } catch (error) {
        if (!isActive) return;

        setDays([]);
        setMonth("");
        setFirstDayIndex(0);
        setError(
          error instanceof Error
            ? error.message
            : "ไม่สามารถโหลดปฏิทินได้",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadCalendar();

    return () => {
      isActive = false;
    };
  }, [fetchCalendar]);

  const cells = useMemo(
    () =>
      [
        ...Array<null>(firstDayIndex).fill(null),
        ...days,
      ] satisfies (VillaCalendarDay | null)[],
    [firstDayIndex, days],
  );

  function closeModal() {
    setSelectedDay(null);
    setSelectedStatus(null);
    setDetail(null);
  }

  async function loadDayDetail(day: number) {
    const status = days.find((item) => item.day === day)?.status ?? null;

    if (status === "booked" || status === "disabled") return;

    setSelectedDay(day);
    setSelectedStatus(status);
    setDetail(null);
    setIsDetailLoading(true);

    try {
      const response = await fetch(
        `/api/villa-calendar/day?id=${encodeURIComponent(villaId)}&offset=${offset}&day=${day}`,
        { cache: "no-store" },
      );
      const body = await readApiResponse<DayDetailResponse>(response);

      setDetail(body.data?.detail ?? null);
    } catch (error) {
      setDetail({
        title:
          error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลวันที่ได้",
      });
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <>
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">ปฏิทินบ้านพัก</h2>
            <p className="text-sm text-muted-foreground">เช็ควันว่างและราคาแต่ละวัน</p>
          </div>
        </div>

        <div className="rounded-md border bg-slate-50 px-3 py-2 text-center font-semibold text-slate-800">
          {isLoading ? "กำลังโหลด..." : month || "ไม่พบข้อมูลปฏิทิน"}
        </div>

        <div className="my-3 grid grid-cols-[1fr_auto_1fr] gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOffset((value) => value - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            ก่อนหน้า
          </Button>
          <Button type="button" variant="outline" onClick={() => setOffset(0)}>
            วันนี้
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOffset((value) => value + 1)}
          >
            ถัดไป
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="flex h-9 items-center justify-center border border-slate-200 bg-slate-50"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((item, index) => {
            if (!item) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const isDisabled =
              item.status === "booked" || item.status === "disabled";

            return (
              <button
                key={`${item.day}-${index}`}
                type="button"
                disabled={isDisabled}
                onClick={() => loadDayDetail(item.day)}
                className={getDayClassName(item.status)}
                aria-label={`${item.day} ${STATUS_LABELS[item.status]}`}
              >
                {isDisabled && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="absolute h-px w-[145%] rotate-45 bg-white/70" />
                    <span className="absolute h-px w-[145%] -rotate-45 bg-white/70" />
                  </span>
                )}
                <span className="relative">{item.day}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs text-slate-700 sm:grid-cols-3">
          {(
            [
              "available",
              "holiday",
              "pending",
              "special",
              "booked",
              "disabled",
            ] as VillaCalendarDayStatus[]
          ).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <StatusSwatch status={status} />
              {STATUS_LABELS[status]}
            </div>
          ))}
        </div>
      </section>

      {isMounted &&
        selectedDay !== null &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="relative w-full max-w-md rounded-lg border bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {isDetailLoading ? (
              <div className="py-8 text-center text-slate-500">
                กำลังโหลด...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedStatus ? STATUS_LABELS[selectedStatus] : "รายละเอียด"}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {detail?.title || `วันที่ ${selectedDay}`}
                  </h3>
                </div>

                <div className="space-y-3 border-t pt-4">
                  {detail?.type && (
                    <DetailRow label="ประเภท" value={detail.type} />
                  )}
                  {detail?.price && (
                    <DetailRow label="ราคา" value={detail.price} highlight />
                  )}
                  {detail?.capacity && (
                    <DetailRow label="รองรับ" value={detail.capacity} />
                  )}
                  {!detail?.type && !detail?.price && !detail?.capacity && (
                    <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                      ไม่มีรายละเอียดเพิ่มเติมสำหรับวันนี้
                    </p>
                  )}
                </div>

                <Button type="button" className="w-full" onClick={closeModal}>
                  ปิด
                </Button>
              </div>
            )}
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 p-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span
        className={
          highlight
            ? "text-lg font-bold text-emerald-700"
            : "font-semibold text-slate-900"
        }
      >
        {value}
      </span>
    </div>
  );
}
