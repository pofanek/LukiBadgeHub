import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { getCachedQuery, invalidateCachedQueries } from "../utils/queryCache";
import {
  getPreviewLeaderboard,
  LEADERBOARD_PREVIEW_ENABLED,
} from "../pages/Rankings/leaderboardPreview";

export type LeaderboardBoard = "experience" | "badges" | "difficulty";
export type LeaderboardEntry = {
  player_rank: number;
  profile_id: string;
  username: string;
  avatar_path: string | null;
  country_code: string | null;
  score: number;
  earned_badges: number;
  earned_experience: number;
  total_players: number;
};

export type LeaderboardPosition = Pick<
  LeaderboardEntry,
  "player_rank" | "score" | "earned_badges" | "earned_experience"
>;

export const LEADERBOARD_CACHE_PREFIX = "leaderboard:";

const LEADERBOARD_CACHE_TTL_MS = 30_000;

export function invalidateLeaderboardCache() {
  invalidateCachedQueries(LEADERBOARD_CACHE_PREFIX);
}

export function useLeaderboard(
  board: LeaderboardBoard,
  difficulty: string | null,
  page: number,
  profileId?: string,
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [position, setPosition] = useState<LeaderboardPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (LEADERBOARD_PREVIEW_ENABLED) {
      queueMicrotask(() => {
        if (!active) return;
        setEntries(getPreviewLeaderboard(board, difficulty, page));
        setPosition(null);
        setError("");
        setIsLoading(false);
      });
      return () => {
        active = false;
      };
    }
    queueMicrotask(() => {
      if (!active) return;
      setIsLoading(true);
      setError("");
    });
    const leaderboardKey = `${LEADERBOARD_CACHE_PREFIX}${board}:${board === "difficulty" ? difficulty || "all" : "all"}:${page}`;
    Promise.all([
      getCachedQuery(
        leaderboardKey,
        LEADERBOARD_CACHE_TTL_MS,
        async () => {
          const { data, error } = await supabase.rpc("get_leaderboard_with_country", {
            p_board: board,
            p_difficulty: board === "difficulty" ? difficulty : null,
            p_page: page,
            p_page_size: 100,
          });
          if (error) throw error;
          return (data || []) as LeaderboardEntry[];
        },
      ),
      profileId
        ? supabase.rpc("get_leaderboard_position", {
            p_board: board,
            p_difficulty: board === "difficulty" ? difficulty : null,
            p_profile_id: profileId,
          })
        : Promise.resolve({ data: [], error: null }),
    ]).then(([leaderboardEntries, positionResult]) => {
      if (!active) return;
      if (positionResult.error) {
        setEntries([]);
        setPosition(null);
        setError("Leaderboards could not be loaded.");
      } else {
        setEntries(leaderboardEntries);
        setPosition(
          ((positionResult.data || [])[0] as LeaderboardPosition | undefined) ||
            null,
        );
      }
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      setEntries([]);
      setPosition(null);
      setError("Leaderboards could not be loaded.");
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [board, difficulty, page, profileId]);

  return { entries, position, isLoading, error };
}
