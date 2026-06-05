function pad(value) {
  return String(value).padStart(2, '0')
}

export function todayLocal() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function utcDateFromIso(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

export function daysAgo(count, baseDate = todayLocal()) {
  return new Date(utcDateFromIso(baseDate) - count * 86400000).toISOString().slice(0, 10)
}
