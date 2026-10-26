export const pad = (n) => String(n).padStart(2, '0')

// 1:02:03 / 25:13
export function clock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000)),
    h = Math.floor(t / 3600),
    m = Math.floor(t / 60) % 60,
    s = t % 60
  return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s)
}
