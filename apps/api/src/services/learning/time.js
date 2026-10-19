const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

export function dayKeyVN(date = new Date()) {
  return new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function vnDayStartUtc(dayKey) {
  return new Date(`${dayKey}T00:00:00.000Z`).getTime() - VN_OFFSET_MS;
}

export function splitSecondsByVnDay(start, seconds) {
  if (seconds <= 0) return [];
  const endMs = start.getTime() + seconds * 1000;
  let cursorMs = start.getTime();
  const parts = [];

  while (cursorMs < endMs) {
    const key = dayKeyVN(new Date(cursorMs));
    const nextMidnightMs = vnDayStartUtc(nextDayKey(key));
    const segmentEndMs = Math.min(endMs, nextMidnightMs);
    const segmentSeconds = Math.max(0, Math.round((segmentEndMs - cursorMs) / 1000));
    if (segmentSeconds > 0) {
      parts.push({ dayKey: key, seconds: segmentSeconds });
    }
    cursorMs = segmentEndMs;
  }

  return parts;
}

function nextDayKey(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}
