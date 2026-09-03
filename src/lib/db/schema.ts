import {
  pgTable, text, timestamp, uuid, varchar, integer, boolean, jsonb, index,
} from "drizzle-orm/pg-core";

// ---------- Auth (Auth.js) ----------
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  timezone: text("timezone").default("Asia/Jakarta"),
  locale: text("locale").default("id"),
  currency: text("currency").default("IDR"),
  dateFormat: text("date_format").default("DD/MM/YYYY"),
  theme: text("theme").default("system"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ---------- Companies ----------
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug"),
  logoUrl: text("logo_url"),
  industry: text("industry"),
  companySize: text("company_size"),
  websiteUrl: text("website_url"),
  linkedinUrl: text("linkedin_url"),
  location: text("location"),
  description: text("description"),
  cultureNotes: text("culture_notes"),
  interestRating: integer("interest_rating"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
}, (t) => [
  index("companies_user_idx").on(t.userId),
]);

// ---------- Application sources ----------
export const applicationSources = pgTable("application_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------- Job applications ----------
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  positionTitle: text("position_title").notNull(),
  location: text("location"),
  workMode: text("work_mode"), // Remote | Hybrid | On-site
  employmentType: text("employment_type"), // Full-time | Part-time | Contract | Internship | Freelance | Temporary
  seniorityLevel: text("seniority_level"), // Internship | Entry Level | Junior | Mid | Senior | Lead | Manager
  sourceId: uuid("source_id").references(() => applicationSources.id, { onDelete: "set null" }),
  jobUrl: text("job_url"),
  jobDescription: text("job_description"),
  jobRequirements: text("job_requirements"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency").default("IDR"),
  salaryPeriod: text("salary_period").default("bulanan"), // Bulanan | Tahunan | Per Jam
  status: text("status").default("Wishlist").notNull(),
  priority: text("priority").default("Medium"), // Low | Medium | High
  foundAt: timestamp("found_at", { mode: "date" }),
  appliedAt: timestamp("applied_at", { mode: "date" }),
  deadlineAt: timestamp("deadline_at", { mode: "date" }),
  lastActivityAt: timestamp("last_activity_at", { mode: "date" }),
  rejectionReason: text("rejection_reason"),
  withdrawalReason: text("withdrawal_reason"),
  notes: text("notes"),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
}, (t) => [
  index("applications_user_status_idx").on(t.userId, t.status),
  index("applications_company_idx").on(t.companyId),
]);

// ---------- Status history ----------
export const applicationStatusHistories = pgTable("application_status_histories", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  note: text("note"),
  changedAt: timestamp("changed_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("status_history_app_idx").on(t.applicationId),
]);

// ---------- Contacts ----------
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  jobTitle: text("job_title"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  notes: text("notes"),
  lastContactedAt: timestamp("last_contacted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("contacts_user_idx").on(t.userId),
]);

// ---------- Application <-> Contact ----------
export const applicationContacts = pgTable("application_contacts", {
  applicationId: uuid("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  role: text("role"),
});

// ---------- Interviews ----------
export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => jobApplications.id, { onDelete: "cascade" }),
  type: text("type").default("Interview"), // Interview | Technical Test | Assessment
  title: text("title").notNull(),
  startAt: timestamp("start_at", { mode: "date" }).notNull(),
  endAt: timestamp("end_at", { mode: "date" }),
  timezone: text("timezone").default("Asia/Jakarta"),
  mode: text("mode").default("Online"), // Online | On-site | Phone Call
  location: text("location"),
  meetingUrl: text("meeting_url"),
  interviewerName: text("interviewer_name"),
  preparationNotes: text("preparation_notes"),
  questions: text("questions"),
  answerNotes: text("answer_notes"),
  evaluationNotes: text("evaluation_notes"),
  status: text("status").default("Scheduled"), // Scheduled | Completed | Cancelled | Rescheduled
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("interviews_user_idx").on(t.userId),
  index("interviews_start_idx").on(t.startAt),
]);

// ---------- Tasks ----------
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => jobApplications.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").default("general"), // general | follow-up | prepare | test | other
  priority: text("priority").default("Medium"),
  status: text("status").default("To Do"), // To Do | In Progress | Completed | Cancelled
  dueAt: timestamp("due_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("tasks_user_idx").on(t.userId),
]);

// ---------- Documents ----------
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").default("other"), // CV | Cover Letter | Portfolio | Certificate | Transcript | Technical Test | Offering Letter | other
  version: integer("version").default(1),
  blobKey: text("blob_key").notNull(),
  originalFilename: text("original_filename"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
}, (t) => [
  index("documents_user_idx").on(t.userId),
]);

// ---------- Application <-> Document ----------
export const applicationDocuments = pgTable("application_documents", {
  applicationId: uuid("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  usageType: text("usage_type").default("submitted"),
  attachedAt: timestamp("attached_at", { mode: "date" }).defaultNow().notNull(),
});

// ---------- Notes ----------
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => jobApplications.id, { onDelete: "cascade" }),
  title: text("title").default("Catatan"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("notes_user_idx").on(t.userId),
]);

// ---------- Notifications ----------
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  readAt: timestamp("read_at", { mode: "date" }),
  deduplicationKey: text("deduplication_key"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("notifications_user_read_idx").on(t.userId, t.readAt),
]);

// ---------- Activities ----------
export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => jobApplications.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}, (t) => [
  index("activities_user_app_idx").on(t.userId, t.applicationId),
]);

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type JobApplication = typeof jobApplications.$inferSelect;
export type ApplicationStatusHistory = typeof applicationStatusHistories.$inferSelect;
export type ApplicationSource = typeof applicationSources.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Activity = typeof activities.$inferSelect;
