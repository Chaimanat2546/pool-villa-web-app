export type VillaCalendarDayStatus =
  | "available"
  | "booked"
  | "pending"
  | "holiday"
  | "special"
  | "disabled";

export type VillaCalendarDay = {
  day: number;
  status: VillaCalendarDayStatus;
};

export type VillaCalendarMonth = {
  month: string;
  firstDayIndex: number;
  days: VillaCalendarDay[];
  offset: number;
};

export type VillaCalendarDayDetail = {
  title?: string;
  price?: string;
  type?: string;
  capacity?: string;
};
