import { describe, it, expect } from "vitest"
import { rate, averageResponseDays } from "../metrics"

describe("rate", () => {
  it("menghitung persentase normal", () => {
    expect(rate(5, 20)).toBe("25%")
    expect(rate(1, 3)).toBe("33%")
  })

  it("menghandle denominator nol", () => {
    expect(rate(0, 0)).toBe("0%")
    expect(rate(5, 0)).toBe("0%")
  })

  it("menghandle nilai null/undefined", () => {
    expect(rate(null, null)).toBe("0%")
    expect(rate(undefined, 10)).toBe("0%")
    expect(rate(3, undefined)).toBe("0%")
  })

  it("menerima string", () => {
    expect(rate("5", "20")).toBe("25%")
  })
})

describe("averageResponseDays", () => {
  it("rata-rata normal", () => {
    expect(averageResponseDays(30, 3)).toBe(10)
    expect(averageResponseDays(10, 4)).toBe(2.5)
  })

  it("count nol", () => {
    expect(averageResponseDays(30, 0)).toBe(0)
    expect(averageResponseDays(null, null)).toBe(0)
  })
})
