export function rate(numerator: number | string | null | undefined, denominator: number | string | null | undefined): string {
  const n = Number(numerator ?? 0)
  const d = Number(denominator ?? 0)
  if (d === 0) return "0%"
  return `${Math.round((n / d) * 100)}%`
}

export function averageResponseDays(totalDays: number | string | null | undefined, count: number | string | null | undefined): number {
  const t = Number(totalDays ?? 0)
  const c = Number(count ?? 0)
  if (c === 0) return 0
  return Math.round((t / c) * 10) / 10
}
