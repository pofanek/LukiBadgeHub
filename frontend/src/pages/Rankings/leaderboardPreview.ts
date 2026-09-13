import type { LeaderboardBoard, LeaderboardEntry } from "../../hooks/useLeaderboard";

// Temporary visual-preview data. Set this to false to return to live Supabase data.
export const LEADERBOARD_PREVIEW_ENABLED = false;

const names = [
  "Aster", "ByteBard", "Cinder", "DuskRunner", "Echo", "Fable", "Glint", "Hollow", "Iris", "Juno",
  "Kestrel", "Lumen", "Morrow", "Nova", "Onyx", "Piper", "Quill", "Rook", "Solace", "Tundra",
];
const countryCodes = ["PL", "US", "GB", "DE", "JP", "CA", "SE", "FR", "AU", "BR", "KR", "CZ"];

function scoreFor(board: LeaderboardBoard, index: number, difficulty: string | null) {
  const base = 120 - index;
  if (board === "experience") return base * base * 185 + (index % 4) * 15;
  if (board === "badges") return base * 3 + (index % 7);
  const multiplier = ["easy", "medium", "hard", "extreme", "supreme", "inhuman"].indexOf(difficulty || "easy") + 1;
  return Math.max(1, Math.round(base * multiplier * 0.62));
}

export function getPreviewLeaderboard(
  board: LeaderboardBoard,
  difficulty: string | null,
  page: number,
) {
  const allEntries: LeaderboardEntry[] = Array.from({ length: 120 }, (_, index) => {
    const score = scoreFor(board, index, difficulty);
    const earnedBadges = board === "difficulty" ? score : Math.max(1, Math.round(score / 3));
    return {
      player_rank: index + 1,
      profile_id: `preview-player-${index + 1}`,
      username: `${names[index % names.length]}${index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : ""}`,
      avatar_path: null,
      country_code: countryCodes[index % countryCodes.length],
      score,
      earned_badges: earnedBadges,
      earned_experience: board === "experience" ? score : score * 240,
      total_players: 120,
    };
  });
  return allEntries.slice((page - 1) * 100, page * 100);
}
