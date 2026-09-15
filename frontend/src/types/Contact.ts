export const CONTACT_TOPICS = [
  "Feedback",
  "Bug Report",
  "Feature Request",
  "Balance Suggestion",
  "Other",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];
