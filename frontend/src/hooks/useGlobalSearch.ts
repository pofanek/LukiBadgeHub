import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export type SearchUser = {
  id: string;
  username: string;
  avatar_path: string | null;
};

export type SearchGame = {
  id: number;
  name: string;
  cover_path: string | null;
  cover_position: string;
};

export type SearchBadge = {
  id: number;
  name: string;
  game_id: number;
  difficulty: "easy" | "medium" | "hard" | "extreme" | "supreme" | "inhuman";
  icon_path: string | null;
  game_name: string;
};

export type GlobalSearchResults = {
  users: SearchUser[];
  games: SearchGame[];
  badges: SearchBadge[];
};

const emptyResults: GlobalSearchResults = { users: [], games: [], badges: [] };

function escapeSearchTerm(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function useGlobalSearch(query: string, limit = 5) {
  const [results, setResults] = useState<GlobalSearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const term = query.trim();
    let isCurrent = true;
    if (term.length < 2) {
      queueMicrotask(() => {
        if (!isCurrent) return;
        setResults(emptyResults);
        setIsLoading(false);
        setHasError(false);
      });
      return () => {
        isCurrent = false;
      };
    }

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setHasError(false);
      const pattern = `%${escapeSearchTerm(term)}%`;

      Promise.all([
        supabase
          .from("user_profiles")
          .select("id, username, avatar_path")
          .ilike("username", pattern)
          .order("username")
          .limit(limit),
        supabase
          .from("games")
          .select("id, name, cover_path, cover_position")
          .eq("is_published", true)
          .ilike("name", pattern)
          .order("name")
          .limit(limit),
        supabase
          .from("game_badges")
          .select("id, name, game_id, difficulty, icon_path")
          .ilike("name", pattern)
          .order("name")
          .limit(limit),
      ]).then(async ([usersResponse, gamesResponse, badgesResponse]) => {
        if (
          usersResponse.error ||
          gamesResponse.error ||
          badgesResponse.error
        ) {
          throw new Error("Search failed.");
        }

        const badges = badgesResponse.data || [];
        const gameIds = [...new Set(badges.map((badge) => badge.game_id))];
        const { data: badgeGames, error: badgeGamesError } = gameIds.length
          ? await supabase.from("games").select("id, name").in("id", gameIds)
          : { data: [], error: null };

        if (badgeGamesError) throw badgeGamesError;
        if (!isCurrent) return;

        const gameNames = new Map(
          (badgeGames || []).map((game) => [game.id, game.name]),
        );
        setResults({
          users: (usersResponse.data || []) as SearchUser[],
          games: (gamesResponse.data || []) as SearchGame[],
          badges: badges.map((badge) => ({
            ...badge,
            game_name: gameNames.get(badge.game_id) || "Unknown game",
          })) as SearchBadge[],
        });
      }).catch(() => {
        if (isCurrent) {
          setResults(emptyResults);
          setHasError(true);
        }
      }).finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [limit, query]);

  return { results, isLoading, hasError };
}
