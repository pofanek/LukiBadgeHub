import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
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
    Promise.all([
      supabase.rpc("get_leaderboard_with_country", {
        p_board: board,
        p_difficulty: board === "difficulty" ? difficulty : null,
        p_page: page,
        p_page_size: 100,
      }),
      profileId
        ? supabase.rpc("get_leaderboard_position", {
            p_board: board,
            p_difficulty: board === "difficulty" ? difficulty : null,
            p_profile_id: profileId,
          })
        : Promise.resolve({ data: [], error: null }),
    ]).then(([leaderboardResult, positionResult]) => {
      if (!active) return;
      if (leaderboardResult.error || positionResult.error) {
        setEntries([]);
        setPosition(null);
        setError("Leaderboards could not be loaded.");
      } else {
        setEntries((leaderboardResult.data || []) as LeaderboardEntry[]);
        setPosition(
          ((positionResult.data || [])[0] as LeaderboardPosition | undefined) ||
            null,
        );
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [board, difficulty, page, profileId]);

  return { entries, position, isLoading, error };
}
