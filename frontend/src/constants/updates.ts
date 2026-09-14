export const UPDATE_TYPES = [
  "Balance",
  "New",
  "Improved",
  "Fixed",
  "Maintenance",
] as const;

export type UpdateType = (typeof UPDATE_TYPES)[number];

export type ProjectUpdate = {
  /** ISO date in YYYY-MM-DD format, for example: 2026-09-14. */
  date: string;
  type: UpdateType;
  title: string;
  summary: string;
};

/**
 * Copy this object when publishing an update. Keep dates in YYYY-MM-DD format.
 *
 * Types:
 * - Balance: EXP, reward, difficulty, or progression adjustments.
 * - New: new games, badges, features, or pages.
 * - Improved: refinements to an existing feature or design.
 * - Fixed: bugs and incorrect behaviour that were resolved.
 * - Maintenance: service work, downtime, or behind-the-scenes changes.
 *
 * const newUpdate: ProjectUpdate = {
 *   date: "2026-09-14",
 *   type: "Balance",
 *   title: "Badge reward adjustments",
 *   summary: "Updated EXP rewards for selected badges.",
 * };
 */

export const projectUpdates: ProjectUpdate[] = [
  {
    date: "2026-09-14",
    type: "New",
    title: "The website is released!",
    summary:
      "After long time waiting, and doing absolutely nothing, I made the website in less than 1 month!.",
  }
  
];

export const latestProjectUpdate = [...projectUpdates].sort((left, right) =>
  right.date.localeCompare(left.date),
)[0];
