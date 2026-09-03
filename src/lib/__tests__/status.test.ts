import { describe, it, expect } from "vitest"
import { STATUSES, STATUS_GROUPS, statusGroup, requiresAppliedDate, isTerminal } from "../status"

describe("STATUSES", () => {
  it("memiliki 13 status sesuai PRD", () => {
    expect(STATUSES).toHaveLength(13)
  })

  it("mengandung semua status dari PRD", () => {
    const expected = [
      "Wishlist", "Preparing", "Applied", "Screening", "Assessment",
      "HR Interview", "User Interview", "Final Interview", "Offering",
      "Accepted", "Rejected", "Withdrawn", "No Response",
    ]
    for (const s of expected) expect(STATUSES).toContain(s)
  })
})

describe("statusGroup", () => {
  it("belum dikirim", () => {
    expect(statusGroup("Wishlist")).toBe("notSent")
    expect(statusGroup("Preparing")).toBe("notSent")
  })

  it("aktif", () => {
    expect(statusGroup("Applied")).toBe("active")
    expect(statusGroup("Screening")).toBe("active")
    expect(statusGroup("Offering")).toBe("active")
  })

  it("selesai", () => {
    expect(statusGroup("Accepted")).toBe("finished")
    expect(statusGroup("Rejected")).toBe("finished")
    expect(statusGroup("Withdrawn")).toBe("finished")
    expect(statusGroup("No Response")).toBe("finished")
  })

  it("status tak dikenal", () => {
    expect(statusGroup("Unknown")).toBe("unknown")
  })
})

describe("requiresAppliedDate", () => {
  it("tidak wajib untuk Wishlist/Preparing", () => {
    expect(requiresAppliedDate("Wishlist")).toBe(false)
    expect(requiresAppliedDate("Preparing")).toBe(false)
  })

  it("wajib untuk Applied dan setelahnya", () => {
    expect(requiresAppliedDate("Applied")).toBe(true)
    expect(requiresAppliedDate("Screening")).toBe(true)
    expect(requiresAppliedDate("Offering")).toBe(true)
    expect(requiresAppliedDate("Rejected")).toBe(true)
    expect(requiresAppliedDate("No Response")).toBe(true)
  })
})

describe("isTerminal", () => {
  it("hanya Rejected dan Withdrawn yang butuh alasan", () => {
    expect(isTerminal("Rejected")).toBe(true)
    expect(isTerminal("Withdrawn")).toBe(true)
    expect(isTerminal("Accepted")).toBe(false)
    expect(isTerminal("Applied")).toBe(false)
  })
})
