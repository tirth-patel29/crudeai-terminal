const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istParts(ts: number) {
  const d = new Date(ts + IST_OFFSET_MS);
  return {
    h: d.getUTCHours(),
    m: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
    day: d.getUTCDate(),
    month: d.getUTCMonth(),
    year: d.getUTCFullYear(),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const p2 = (n: number) => String(n).padStart(2, "0");

/** Deterministic IST clock time (HH:MM). */
export function fmtTime(ts: number, withSeconds = false) {
  const { h, m, s } = istParts(ts);
  return withSeconds ? `${p2(h)}:${p2(m)}:${p2(s)}` : `${p2(h)}:${p2(m)}`;
}

export function fmtDate(ts: number) {
  const { day, month } = istParts(ts);
  return `${p2(day)} ${MONTHS[month]}`;
}

export function fmtDateTime(ts: number) {
  return `${fmtDate(ts)} ${fmtTime(ts, true)}`;
}

export function fmtPrice(v: number, digits = 2) {
  return v.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtInr(v: number, digits = 0) {
  const sign = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sign}₹${Math.abs(v).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function fmtPct(v: number, digits = 2) {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}

export function fmtCompact(v: number) {
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}
