import { useCallback, useEffect, useState } from "react";
import { hollow, hollowthumb } from "../assets";
import {
  BADGE_DIFFICULTIES,
  catalogueGames,
  getBadgeDifficultyLabel,
  getBadgeExperience,
  type BadgeRow,
  type CatalogueGame,
  type GameRow,
} from "../constants";
import { supabase } from "../utils/supabase";
import { mediaUrl } from "../utils/media";

export const GAME_FIELDS =
  "id, name, description, developer, publisher, release_date, genres, steam_url, cover_path, cover_position, banner_path, is_published, created_at, updated_at";

export const GAMES_PAGE_SIZE = 12;

export type GameSort = "name" | "release" | "experience" | "badges" | "created";

type GamesPageOptions = {
  includeDrafts?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  genre?: string;
  gameIds?: number[];
  sort?: GameSort;
};

function gameMediaUrl(path: string | null, fallback: string) {
  return mediaUrl(path) || fallback;
}

export function toCatalogueGame(
  game: GameRow,
  badges: BadgeRow[] = [],
): CatalogueGame {
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
    achievementCount: badges.length,
    totalExp: badges.reduce(
      (total, badge) =>
        total + getBadgeExperience(badge.difficulty, badge.tier),
      0,
    ),
    popularity: 0,
    difficulties: BADGE_DIFFICULTIES.map((difficulty) => ({
      label: getBadgeDifficultyLabel(difficulty),
      achievementCount: badges.filter(
        (badge) => badge.difficulty === difficulty,
      ).length,
    })).filter((difficulty) => difficulty.achievementCount > 0),
    badges,
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
  const [{ data, error }, { data: badgeData, error: badgeError }] =
    await Promise.all([
      query,
      supabase.from("game_badges").select("*").order("created_at"),
    ]);
  if (error) throw error;
  if (badgeError) throw badgeError;
  const badgesByGame = new Map<number, BadgeRow[]>();
  ((badgeData || []) as BadgeRow[]).forEach((badge) => {
    badgesByGame.set(badge.game_id, [
      ...(badgesByGame.get(badge.game_id) || []),
      badge,
    ]);
  });
  return (data as GameRow[]).map((game) =>
    toCatalogueGame(game, badgesByGame.get(game.id)),
  );
}

export async function fetchGamesPage({
  includeDrafts = false,
  page = 0,
  pageSize = GAMES_PAGE_SIZE,
  search = "",
  genre,
  gameIds,
  sort = "created",
}: GamesPageOptions = {}) {
  if (gameIds && !gameIds.length) return { games: [], count: 0 };

  if (sort === "experience" || sort === "badges") {
    let aggregateQuery = supabase.from("games").select(GAME_FIELDS);

    if (!includeDrafts) aggregateQuery = aggregateQuery.eq("is_published", true);
    if (search.trim()) aggregateQuery = aggregateQuery.ilike("name", `%${search.trim()}%`);
    if (genre) aggregateQuery = aggregateQuery.contains("genres", [genre]);
    if (gameIds) aggregateQuery = aggregateQuery.in("id", gameIds);

    const { data: aggregateData, error: aggregateError } = await aggregateQuery;
    if (aggregateError) throw aggregateError;

    const aggregateGames = (aggregateData || []) as GameRow[];
    const aggregateGameIds = aggregateGames.map((game) => game.id);
    const { data: aggregateBadgeData, error: aggregateBadgeError } =
      aggregateGameIds.length
        ? await supabase
            .from("game_badges")
            .select("*")
            .in("game_id", aggregateGameIds)
        : { data: [], error: null };
    if (aggregateBadgeError) throw aggregateBadgeError;

    const badgesByGame = new Map<number, BadgeRow[]>();
    ((aggregateBadgeData || []) as BadgeRow[]).forEach((badge) => {
      badgesByGame.set(badge.game_id, [
        ...(badgesByGame.get(badge.game_id) || []),
        badge,
      ]);
    });

    const sortedGames = aggregateGames
      .map((game) => toCatalogueGame(game, badgesByGame.get(game.id)))
      .sort((left, right) => {
        const difference =
          sort === "experience"
            ? right.totalExp - left.totalExp
            : right.achievementCount - left.achievementCount;
        return difference || left.id - right.id;
      });

    return {
      games: sortedGames.slice(page * pageSize, (page + 1) * pageSize),
      count: sortedGames.length,
    };
  }

  let query = supabase.from("games").select(GAME_FIELDS, { count: "exact" });

  if (!includeDrafts) query = query.eq("is_published", true);
  if (search.trim()) query = query.ilike("name", `%${search.trim()}%`);
  if (genre) query = query.contains("genres", [genre]);
  if (gameIds) query = query.in("id", gameIds);

  if (sort === "name") {
    query = query.order("name", { ascending: true }).order("id", {
      ascending: true,
    });
  } else if (sort === "release") {
    query = query
      .order("release_date", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
  } else {
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
  }

  const { data, error, count } = await query.range(
    page * pageSize,
    page * pageSize + pageSize - 1,
  );
  if (error) throw error;

  const gameRows = (data || []) as GameRow[];
  const gameIdsOnPage = gameRows.map((game) => game.id);
  const { data: badgeData, error: badgeError } = gameIdsOnPage.length
    ? await supabase
        .from("game_badges")
        .select("*")
        .in("game_id", gameIdsOnPage)
    : { data: [], error: null };
  if (badgeError) throw badgeError;

  const badgesByGame = new Map<number, BadgeRow[]>();
  ((badgeData || []) as BadgeRow[]).forEach((badge) => {
    badgesByGame.set(badge.game_id, [
      ...(badgesByGame.get(badge.game_id) || []),
      badge,
    ]);
  });

  return {
    games: gameRows.map((game) =>
      toCatalogueGame(game, badgesByGame.get(game.id)),
    ),
    count: count || 0,
  };
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
    Promise.all([
      supabase.from("games").select(GAME_FIELDS).eq("id", gameId).maybeSingle(),
      supabase.from("game_badges").select("*").eq("game_id", gameId),
    ]).then(
      ([
        { data, error: queryError },
        { data: badgeData, error: badgeError },
      ]) => {
        if (!active) return;
        if (queryError || badgeError || !data) {
          setGame(null);
          setError("This game could not be found.");
        } else {
          setGame(
            toCatalogueGame(data as GameRow, (badgeData || []) as BadgeRow[]),
          );
        }
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
    };
  }, [gameId]);

  return { game, isLoading, error };
}
