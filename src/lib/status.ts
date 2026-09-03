export const STATUSES = [
  "Wishlist",
  "Preparing",
  "Applied",
  "Screening",
  "Assessment",
  "HR Interview",
  "User Interview",
  "Final Interview",
  "Offering",
  "Accepted",
  "Rejected",
  "Withdrawn",
  "No Response",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_GROUPS = {
  notSent: ["Wishlist", "Preparing"],
  active: [
    "Applied", "Screening", "Assessment",
    "HR Interview", "User Interview", "Final Interview", "Offering",
  ],
  finished: ["Accepted", "Rejected", "Withdrawn", "No Response"],
} as const;

export function statusGroup(status: string): "notSent" | "active" | "finished" | "unknown" {
  if ((STATUS_GROUPS.notSent as readonly string[]).includes(status)) return "notSent";
  if ((STATUS_GROUPS.active as readonly string[]).includes(status)) return "active";
  if ((STATUS_GROUPS.finished as readonly string[]).includes(status)) return "finished";
  return "unknown";
}

export const STATUS_COLORS: Record<string, string> = {
  Wishlist: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Preparing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  Applied: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Screening: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  Assessment: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  "HR Interview": "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "User Interview": "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  "Final Interview": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  Offering: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Withdrawn: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  "No Response": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function requiresAppliedDate(status: string): boolean {
  return !(STATUS_GROUPS.notSent as readonly string[]).includes(status);
}

export function isTerminal(status: string): boolean {
  return ["Rejected", "Withdrawn"].includes(status);
}
