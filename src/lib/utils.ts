import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function parseTimeString(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function addMinutes(timeStr: string, minutes: number): string {
  const d = parseTimeString(timeStr);
  d.setMinutes(d.getMinutes() + minutes);
  return formatTime(d);
}

export function minutesBetween(timeA: string, timeB: string): number {
  const a = parseTimeString(timeA).getTime();
  const b = parseTimeString(timeB).getTime();
  return Math.round((b - a) / 60000);
}

export function uid(prefix = ""): string {
  return (
    prefix +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}

export function gradeLabel(grade: number): string {
  if (grade <= 3) return `${grade}年级(低年级)`;
  return `${grade}年级`;
}

export function routeColorClass(index: 1 | 2 | 3 | 4): string {
  return `route-color-${index}`;
}

export function routeBarClass(index: 1 | 2 | 3 | 4): string {
  return `route-bar-${index}`;
}

export function todayStr(): string {
  return formatDate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function isTodayInRange(
  startDate: string,
  endDate?: string
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  if (!endDate) return s.getTime() <= today.getTime();
  const e = new Date(endDate);
  e.setHours(23, 59, 59, 999);
  return today.getTime() >= s.getTime() && today.getTime() <= e.getTime();
}

export function isDateInRange(
  dateStr: string,
  startDate: string,
  endDate?: string
): boolean {
  const d = new Date(dateStr);
  d.setHours(12, 0, 0, 0);
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  if (!endDate) return s.getTime() <= d.getTime();
  const e = new Date(endDate);
  e.setHours(23, 59, 59, 999);
  return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
}

export function getDayOfWeekFromDate(dateStr: string): number {
  return new Date(dateStr).getDay();
}

export function formatDateCN(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
}

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

export function statusLabel(
  status: "normal" | "full" | "fault" | "inspection_expired" | "replacement"
): { label: string; cls: string } {
  switch (status) {
    case "normal":
      return { label: "正常", cls: "bg-jade-100 text-jade-700 dark:bg-jade-950/50 dark:text-jade-300" };
    case "full":
      return { label: "满员", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" };
    case "fault":
      return { label: "故障", cls: "bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300" };
    case "inspection_expired":
      return { label: "年检到期", cls: "bg-crimson-100 text-crimson-700 dark:bg-crimson-950/50 dark:text-crimson-300" };
    case "replacement":
      return { label: "替换车", cls: "bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200" };
  }
}

export function weatherLabel(type: string): { icon: string; label: string } {
  switch (type) {
    case "rain":
      return { icon: "cloud-rain", label: "降雨" };
    case "snow":
      return { icon: "snowflake", label: "降雪" };
    case "fog":
      return { icon: "cloud-fog", label: "大雾" };
    case "storm":
      return { icon: "cloud-lightning", label: "暴雨" };
    case "heat":
      return { icon: "sun", label: "高温" };
    default:
      return { icon: "cloud", label: "天气" };
  }
}
