// Dates are local calendar days in YYYY-MM-DD form.

const pad = (value: number) => String(value).padStart(2, '0')

export function todayLocal(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function utcDateFromIso(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function daysAgo(count: number, baseDate = todayLocal()): string {
  return new Date(utcDateFromIso(baseDate) - count * 86400000).toISOString().slice(0, 10)
}
