import { useCallback, useEffect, useState } from "react";
import { hollow, hollowthumb } from "../assets";
import { catalogueGames, type CatalogueGame, type GameRow } from "../constants";
import { supabase } from "../utils/supabase";

export const GAME_FIELDS =
  "id, name, description, developer, publisher, release_date, genres, steam_url, cover_path, cover_position, banner_path, is_published, created_at, updated_at";

function gameMediaUrl(path: string | null, fallback: string) {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return supabase.storage.from("game-media").getPublicUrl(path).data.publicUrl;
}

export function toCatalogueGame(game: GameRow): CatalogueGame {
  const fallback = catalogueGames.find(({ id }) => id === game.id);
  const coverFallback = fallback?.cover || hollowthumb;
  const bannerFallback = fallback?.bannerUrl || hollow;

  return {
    id: game.id,
    title: game.name,
    genres: game.genres || [],
    releaseYear: game.release_date
      ? new Date(`${game.release_date}T00:00:00`).getFullYear()
      : 0,
    achievementCount: 0,
    totalExp: 0,
    popularity: 0,
    difficulties: [],
    cover: gameMediaUrl(game.cover_path, coverFallback),
    coverPosition: game.cover_position || "center",
    bannerUrl: gameMediaUrl(game.banner_path, bannerFallback),
    developer: game.developer,
    publisher: game.publisher,
    releaseDate: game.release_date,
    description: game.description,
    steamUrl: game.steam_url,
    isPublished: game.is_published,
  };
}

export async function fetchGames(includeDrafts = false) {
  let query = supabase.from("games").select(GAME_FIELDS).order("created_at", {
    ascending: false,
  });
  if (!includeDrafts) query = query.eq("is_published", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as GameRow[]).map(toCatalogueGame);
}

export function useGames(includeDrafts = false) {
  const [games, setGames] = useState<CatalogueGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setGames(await fetchGames(includeDrafts));
    } catch {
      setGames([]);
      setError("Games could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [includeDrafts]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { games, isLoading, error, refresh };
}

export function useGame(gameId?: number) {
  const [game, setGame] = useState<CatalogueGame | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(gameId));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!gameId) {
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (!active) return;
      setIsLoading(true);
      setError("");
    });
    supabase
      .from("games")
      .select(GAME_FIELDS)
      .eq("id", gameId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError || !data) {
          setGame(null);
          setError("This game could not be found.");
        } else {
          setGame(toCatalogueGame(data as GameRow));
        }
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  return { game, isLoading, error };
}
