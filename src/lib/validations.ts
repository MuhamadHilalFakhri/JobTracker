import { z } from "zod"
import { STATUSES } from "@/lib/status"

export const applicationSchema = z.object({
  positionTitle: z.string().min(1, "Nama posisi wajib diisi").max(200),
  companyId: z.string().uuid().nullable().optional(),
  companyName: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]).nullable().optional(),
  employmentType: z.enum(["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary"]).nullable().optional(),
  seniorityLevel: z.enum(["Internship", "Entry Level", "Junior", "Mid", "Senior", "Lead", "Manager"]).nullable().optional(),
  sourceId: z.string().uuid().nullable().optional(),
  sourceName: z.string().max(100).optional(),
  jobUrl: z.string().url("URL tidak valid").or(z.literal("")).optional(),
  jobDescription: z.string().optional(),
  jobRequirements: z.string().optional(),
  salaryMin: z.coerce.number().int().min(0).nullable().optional(),
  salaryMax: z.coerce.number().int().min(0).nullable().optional(),
  salaryCurrency: z.string().max(10).optional(),
  salaryPeriod: z.enum(["Bulanan", "Tahunan", "Per Jam"]).nullable().optional(),
  status: z.enum(STATUSES as unknown as [string, ...string[]]).default("Wishlist"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  foundAt: z.string().nullable().optional(),
  appliedAt: z.string().nullable().optional(),
  deadlineAt: z.string().nullable().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.salaryMin != null && data.salaryMax != null && data.salaryMin > data.salaryMax) {
    ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "Gaji maksimum tidak boleh lebih kecil dari minimum" })
  }
})

export const companySchema = z.object({
  name: z.string().min(1, "Nama perusahaan wajib diisi").max(200),
  industry: z.string().max(100).optional(),
  companySize: z.string().max(50).optional(),
  websiteUrl: z.string().url("URL tidak valid").or(z.literal("")).optional(),
  linkedinUrl: z.string().url("URL tidak valid").or(z.literal("")).optional(),
  location: z.string().max(200).optional(),
  description: z.string().optional(),
  cultureNotes: z.string().optional(),
  interestRating: z.coerce.number().int().min(0).max(5).nullable().optional(),
})

export const contactSchema = z.object({
  name: z.string().min(1, "Nama kontak wajib diisi").max(200),
  companyId: z.string().uuid().nullable().optional(),
  jobTitle: z.string().max(200).optional(),
  email: z.string().email("Email tidak valid").or(z.literal("")).optional(),
  phone: z.string().max(50).optional(),
  linkedinUrl: z.string().url("URL tidak valid").or(z.literal("")).optional(),
  notes: z.string().optional(),
})

export const interviewSchema = z.object({
  applicationId: z.string().uuid().nullable().optional(),
  type: z.string().max(100).default("Interview"),
  title: z.string().min(1, "Judul wajib diisi").max(200),
  startAt: z.string().min(1, "Waktu mulai wajib diisi"),
  endAt: z.string().optional(),
  timezone: z.string().max(50).optional(),
  mode: z.enum(["Online", "On-site", "Phone Call"]).default("Online"),
  location: z.string().max(200).optional(),
  meetingUrl: z.string().url("URL tidak valid").or(z.literal("")).optional(),
  interviewerName: z.string().max(200).optional(),
  preparationNotes: z.string().optional(),
  status: z.enum(["Scheduled", "Completed", "Cancelled", "Rescheduled"]).default("Scheduled"),
}).superRefine((data, ctx) => {
  if (data.endAt && data.startAt && new Date(data.endAt) <= new Date(data.startAt)) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "Waktu selesai harus setelah waktu mulai" })
  }
})

export const taskSchema = z.object({
  title: z.string().min(1, "Judul task wajib diisi").max(200),
  description: z.string().optional(),
  applicationId: z.string().uuid().nullable().optional(),
  type: z.enum(["general", "follow-up", "prepare", "test", "other"]).default("general"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  dueAt: z.string().optional(),
})

export const noteSchema = z.object({
  applicationId: z.string().uuid().nullable().optional(),
  title: z.string().max(200).default("Catatan"),
  content: z.string().min(1, "Isi catatan wajib diisi"),
})

export const profileSchema = z.object({
  name: z.string().min(1).max(200),
  timezone: z.string().max(50),
  locale: z.string().max(10),
  currency: z.string().max(10),
  dateFormat: z.string().max(20),
  theme: z.enum(["light", "dark", "system"]),
})
