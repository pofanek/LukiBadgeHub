export const BADGE_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
  "extreme",
  "supreme",
  "inhuman",
] as const;

export const BADGE_TIERS = ["low", "mid", "high"] as const;

export type BadgeDifficultyId = (typeof BADGE_DIFFICULTIES)[number];
export type BadgeTier = (typeof BADGE_TIERS)[number];

export type BadgeRow = {
  id: number;
  game_id: number;
  created_at: string;
  name: string;
  description: string;
  additional_note: string | null;
  difficulty: BadgeDifficultyId;
  tier: BadgeTier;
  icon_path: string | null;
};

export const BADGE_DIFFICULTY_DETAILS: Record<
  BadgeDifficultyId,
  { label: string; color: string; icon: string }
> = {
  easy: { label: "Easy", color: "#78b159", icon: "/easy.png" },
  medium: { label: "Medium", color: "#fdcb58", icon: "/medium.png" },
  hard: { label: "Hard", color: "#f4900c", icon: "/hard.png" },
  extreme: { label: "Extreme", color: "#dd2e44", icon: "/extreme.png" },
  supreme: { label: "Supreme", color: "#aa8ed6", icon: "/supreme.png" },
  inhuman: { label: "Inhuman", color: "#31373d", icon: "/inhuman.png" },
};

const badgeExperience: Record<BadgeDifficultyId, Record<BadgeTier, number>> = {
  easy: { low: 5, mid: 7, high: 10 },
  medium: { low: 15, mid: 21, high: 30 },
  hard: { low: 60, mid: 84, high: 120 },
  extreme: { low: 600, mid: 840, high: 1200 },
  supreme: { low: 5000, mid: 7500, high: 10000 },
  inhuman: { low: 35000, mid: 50000, high: 70000 },
};

export function getBadgeExperience(
  difficulty: BadgeDifficultyId,
  tier: BadgeTier,
) {
  return badgeExperience[difficulty][tier];
}

export function getBadgeTierLabel(tier: BadgeTier) {
  return tier[0].toUpperCase() + tier.slice(1);
}

export function getBadgeDifficultyLabel(difficulty: BadgeDifficultyId) {
  return BADGE_DIFFICULTY_DETAILS[difficulty].label;
}
