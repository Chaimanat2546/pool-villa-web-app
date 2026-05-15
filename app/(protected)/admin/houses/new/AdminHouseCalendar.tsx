"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DatePriceDraft = {
  id: string;
  stayDate: string;
  priceType: "special" | "holiday";
  price: string;
  agencyPrice: string;
  note: string;
  isActive: boolean;
};

type AdminHouseCalendarProps = {
  datePrices: DatePriceDraft[];
  setDatePrices: (value: DatePriceDraft[] | ((current: DatePriceDraft[]) => DatePriceDraft[])) => void;
  createDraftId: () => string;
};

const WEEK_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const STATUS_LABELS = {
  available: "วันปกติ",
  holiday: "วันหยุด",
  special: "ราคาพิเศษ",
};

function getDayClassName(status: "special" | "holiday" | "available", isSelected: boolean, isInRange: boolean) {
  const base =
    "relative flex aspect-square select-none items-center justify-center overflow-hidden rounded-md border text-sm font-semibold transition";

  if (isSelected) {
    return `${base} ring-2 ring-primary border-primary z-10 shadow-md scale-105 bg-primary/10`;
  }

  if (isInRange) {
    return `${base} bg-sky-100 border-sky-300 z-0`;
  }

  if (status === "special") {
    return `${base} border-orange-500 bg-orange-500 text-white hover:bg-orange-600`;
  }

  if (status === "holiday") {
    return `${base} border-amber-300 bg-amber-100 text-slate-800 hover:bg-amber-200`;
  }

  return `${base} border-slate-200 bg-white text-slate-800 hover:border-sky-300 hover:bg-sky-50`;
}

function parseDateInput(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }
  return date;
}

function formatDateInput(date: Date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRange(startsAt: string, endsAt: string) {
  const startDate = parseDateInput(startsAt);
  const endDate = parseDateInput(endsAt || startsAt);
  if (!startDate || !endDate || endDate < startDate) return [];
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(formatDateInput(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function AdminHouseCalendar({ datePrices, setDatePrices, createDraftId }: AdminHouseCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<string | null>(null);

  // Original Bulk Add State
  const [bulkRange, setBulkRange] = useState({
    startsAt: "",
    endsAt: "",
    priceType: "special" as const,
    price: "",
    agencyPrice: "",
    note: "",
    isActive: true,
  });

  const month = useMemo(() => {
    return new Intl.DateTimeFormat("th-TH", {
      month: "long",
      year: "numeric",
    }).format(viewDate);
  }, [viewDate]);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Array<{ date: string; day: number; isPadding: boolean }> = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ date: "", day: 0, isPadding: true });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: dateStr, day: i, isPadding: false });
    }

    return days;
  }, [viewDate]);

  const datePriceMap = useMemo(() => {
    const map = new Map<string, DatePriceDraft>();
    datePrices.forEach(dp => {
      const existing = map.get(dp.stayDate);
      if (!existing || dp.priceType === "special") {
        map.set(dp.stayDate, dp);
      }
    });
    return map;
  }, [datePrices]);

  const currentEdit = useMemo(() => {
    if (selectedDates.length === 0) return null;

    // If multiple dates selected, try to find common values or use defaults
    const firstDate = selectedDates[0];
    const existing = datePriceMap.get(firstDate);

    return {
      id: existing?.id || "",
      stayDate: selectedDates.join(", "),
      priceType: existing?.priceType || "special" as const,
      price: existing?.price || "",
      agencyPrice: existing?.agencyPrice || "",
      note: existing?.note || "",
      isActive: existing?.isActive ?? true,
    };
  }, [selectedDates, datePriceMap]);

  function changeMonth(offset: number) {
    setViewDate(current => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  }

  function handleDateClick(date: string, isShift: boolean) {
    if (isShift && rangeStart) {
      const start = new Date(rangeStart);
      const end = new Date(date);
      const dates: string[] = [];

      const [low, high] = start < end ? [start, end] : [end, start];
      const curr = new Date(low);
      while (curr <= high) {
        dates.push(`${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`);
        curr.setDate(curr.getDate() + 1);
      }
      setSelectedDates(dates);
    } else {
      setRangeStart(date);
      setSelectedDates([date]);
    }
  }

  function handleSave(draft: Omit<DatePriceDraft, "stayDate">) {
    setDatePrices(current => {
      let next = [...current];

      selectedDates.forEach(date => {
        next = next.filter(dp => dp.stayDate !== date);
        if (draft.price.trim()) {
          next.push({
            ...draft,
            id: createDraftId(),
            stayDate: date
          });
        }
      });

      return next.sort((a, b) => a.stayDate.localeCompare(b.stayDate));
    });
    setSelectedDates([]);
    setRangeStart(null);
  }

  function handleDelete() {
    setDatePrices(current => {
      let next = [...current];
      selectedDates.forEach(date => {
        next = next.filter(dp => dp.stayDate !== date);
      });
      return next;
    });
    setSelectedDates([]);
    setRangeStart(null);
  }

  function addBulkRange() {
    const dates = getDateRange(bulkRange.startsAt, bulkRange.endsAt);
    const price = bulkRange.price.trim();
    const agencyPrice = bulkRange.agencyPrice.trim();

    if (dates.length === 0 || !price) return;

    setDatePrices(current => {
      let next = [...current];
      dates.forEach(date => {
        next = next.filter(dp => dp.stayDate !== date);
        next.push({
          id: createDraftId(),
          stayDate: date,
          priceType: bulkRange.priceType,
          price,
          agencyPrice: agencyPrice || "",
          note: bulkRange.note,
          isActive: bulkRange.isActive,
        });
      });
      return next.sort((a, b) => a.stayDate.localeCompare(b.stayDate));
    });

    setBulkRange({
      startsAt: "",
      endsAt: "",
      priceType: "special",
      price: "",
      agencyPrice: "",
      note: "",
      isActive: true,
    });
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h2 className="text-lg font-semibold text-card-foreground">เพิ่มราคาพิเศษตามช่วงเวลา</h2>
        <div className="mt-4 grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[150px_150px_150px_1fr_1fr_1fr_auto_auto]">
          <Input
            value={bulkRange.startsAt}
            aria-label="วันที่เริ่มต้น"
            onChange={(e) => setBulkRange(c => ({ ...c, startsAt: e.target.value }))}
            type="date"
          />
          <Input
            value={bulkRange.endsAt}
            aria-label="วันที่สิ้นสุด"
            onChange={(e) => setBulkRange(c => ({ ...c, endsAt: e.target.value }))}
            type="date"
          />
          <select
            value={bulkRange.priceType}
            aria-label="ประเภทราคา"
            onChange={(e) => setBulkRange(c => ({ ...c, priceType: e.target.value as any }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="special">ราคาพิเศษ</option>
            <option value="holiday">วันหยุด</option>
          </select>
          <Input
            value={bulkRange.price}
            aria-label="ราคาปกติ"
            onChange={(e) => setBulkRange(c => ({ ...c, price: e.target.value }))}
            min="0"
            placeholder="ราคาปกติ"
            type="number"
          />
          <Input
            value={bulkRange.agencyPrice}
            aria-label="ราคา Agency"
            onChange={(e) => setBulkRange(c => ({ ...c, agencyPrice: e.target.value }))}
            min="0"
            placeholder="ราคา Agency"
            type="number"
          />
          <Input
            value={bulkRange.note}
            aria-label="หมายเหตุ"
            onChange={(e) => setBulkRange(c => ({ ...c, note: e.target.value }))}
            placeholder="หมายเหตุ"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={bulkRange.isActive}
              onChange={(e) => setBulkRange(c => ({ ...c, isActive: e.target.checked }))}
              type="checkbox"
              className="h-4 w-4 accent-brand"
            />
            active
          </label>
          <Button type="button" variant="outline" onClick={addBulkRange}>
            <Plus aria-hidden />
            เพิ่มช่วงวัน
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">ราคาพิเศษรายวัน</h3>
            <p className="text-xs text-muted-foreground">คลิกเพื่อเลือกวันเดียว, Shift + คลิกเพื่อเลือกช่วงวัน</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center font-medium">{month}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="flex h-9 items-center justify-center border border-slate-200 bg-slate-50">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-t border-slate-200">
          {daysInMonth.map((item, index) => {
            if (item.isPadding) {
              return <div key={`padding-${index}`} className="aspect-square border-b border-r border-slate-200 bg-slate-50/30" />;
            }

            const datePrice = datePriceMap.get(item.date);
            const status = datePrice ? datePrice.priceType : "available";
            const isSelected = selectedDates.includes(item.date);

            let isInRange = false;
            if (rangeStart && !isSelected && selectedDates.length === 0) {
              // This is for visual feedback if we had drag-select, but for now we only have Shift+Click
            }

            return (
              <button
                key={item.date}
                type="button"
                onClick={(e) => handleDateClick(item.date, e.shiftKey)}
                className={`${getDayClassName(status, isSelected, isInRange)} aspect-square rounded-none border-0 border-b border-r border-slate-200`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm">{item.day}</span>
                  {datePrice && (
                    <span className="mt-1 text-[10px] font-bold opacity-90">
                      {Number(datePrice.price).toLocaleString()}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-slate-300 bg-white" />
            <span>{STATUS_LABELS.available}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-orange-500 bg-orange-500" />
            <span>{STATUS_LABELS.special}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-amber-300 bg-amber-100" />
            <span>{STATUS_LABELS.holiday}</span>
          </div>
        </div>

        {selectedDates.length > 0 && currentEdit && (
          <EditModal
            draft={currentEdit}
            selectedCount={selectedDates.length}
            onClose={() => {
              setSelectedDates([]);
              setRangeStart(null);
            }}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}


function EditModal({
  draft,
  selectedCount,
  onClose,
  onSave,
  onDelete,
}: {
  draft: DatePriceDraft;
  selectedCount: number;
  onClose: () => void;
  onSave: (draft: DatePriceDraft) => void;
  onDelete: () => void;
}) {
  const [localDraft, setLocalDraft] = useState(draft);

  const title = selectedCount > 1
    ? `ตั้งค่าราคาพิเศษ (${selectedCount} วัน)`
    : "ตั้งค่าราคาพิเศษ";

  const subTitle = selectedCount > 1
    ? "คุณกำลังแก้ไขราคาสำหรับหลายวันที่เลือกพร้อมกัน"
    : new Intl.DateTimeFormat("th-TH", { dateStyle: "full" }).format(new Date(draft.stayDate));

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]">
      <div className="relative w-full max-w-md rounded-lg border bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-muted-foreground">{subTitle}</p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>ประเภท</Label>
            <select
              value={localDraft.priceType}
              onChange={(e) => setLocalDraft(curr => ({ ...curr, priceType: e.target.value as any }))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="special">ราคาพิเศษ</option>
              <option value="holiday">วันหยุด</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>ราคาปกติ</Label>
              <Input
                type="number"
                value={localDraft.price}
                onChange={(e) => setLocalDraft(curr => ({ ...curr, price: e.target.value }))}
                placeholder="ราคาปกติ"
              />
            </div>
            <div className="grid gap-2">
              <Label>ราคา Agency</Label>
              <Input
                type="number"
                value={localDraft.agencyPrice}
                onChange={(e) => setLocalDraft(curr => ({ ...curr, agencyPrice: e.target.value }))}
                placeholder="ราคา Agency"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>หมายเหตุ</Label>
            <Input
              value={localDraft.note}
              onChange={(e) => setLocalDraft(curr => ({ ...curr, note: e.target.value }))}
              placeholder="เช่น โปรโมชั่นสงกรานต์"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={localDraft.isActive}
              onChange={(e) => setLocalDraft(curr => ({ ...curr, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isActive">เปิดใช้งาน</Label>
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          {draft.id && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              ลบ
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="button" onClick={() => onSave(localDraft)}>
            <Save className="mr-2 h-4 w-4" />
            บันทึก
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
