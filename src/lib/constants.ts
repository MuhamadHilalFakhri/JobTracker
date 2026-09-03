export const WORK_MODES = ["Remote", "Hybrid", "On-site"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary"] as const;
export const SENIORITY_LEVELS = ["Internship", "Entry Level", "Junior", "Mid", "Senior", "Lead", "Manager"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;
export const SALARY_PERIODS = ["Bulanan", "Tahunan", "Per Jam"] as const;
export const CURRENCIES = ["IDR", "USD", "SGD", "EUR"] as const;
export const DOCUMENT_TYPES = ["CV", "Cover Letter", "Portfolio", "Certificate", "Transcript", "Technical Test", "Offering Letter", "other"] as const;
export const INTERVIEW_MODES = ["Online", "On-site", "Phone Call"] as const;
export const INTERVIEW_TYPES = ["HR Interview", "User Interview", "Final Interview", "Technical Test", "Assessment"] as const;
export const INTERVIEW_STATUSES = ["Scheduled", "Completed", "Cancelled", "Rescheduled"] as const;
export const TASK_TYPES = ["general", "follow-up", "prepare", "test", "other"] as const;
export const TASK_STATUSES = ["To Do", "In Progress", "Completed", "Cancelled"] as const;
export const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;

export const DEMO_USER_ID = "demo-user";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
