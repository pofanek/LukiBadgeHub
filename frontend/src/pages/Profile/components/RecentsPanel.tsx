import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import { FaThumbtack } from "react-icons/fa";
import { LoadingIndicator } from "../../../components";
import {
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  getBadgeTierLabel,
  type BadgeRow,
  type CatalogueGame,
  type GameRow,
} from "../../../constants";
import { GAME_FIELDS, toCatalogueGame } from "../../../hooks/useGames";
import { usePinnedBadge } from "../../../hooks/usePinnedBadge";
import { supabase } from "../../../utils/supabase";

type BadgeClaim = {
  badge_id: number;
  earned_at: string;
};

type RecentBadge = {
  badge: BadgeRow;
  earnedAt: string;
  game: CatalogueGame;
};

function badgeIconUrl(badge: BadgeRow) {
  if (badge.icon_path) {
    return supabase.storage.from("game-media").getPublicUrl(badge.icon_path)
      .data.publicUrl;
  }
  return BADGE_DIFFICULTY_DETAILS[badge.difficulty].icon;
}

function RecentsPanel({
  profileId,
  isOwnProfile,
}: {
  profileId: string;
  isOwnProfile: boolean;
}) {
  const [recentBadges, setRecentBadges] = useState<RecentBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const { pinnedBadgeId, setPinnedBadge, isSaving } = usePinnedBadge(profileId);

  const loadPage = useCallback(async (page: number, replace = false) => {
    const pageSize = 12;
    replace ? setIsLoading(true) : setIsLoadingMore(true);
    setError("");
    const { data: claimData, error: claimError } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", profileId)
      .order("earned_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize);
    if (claimError) {
      setError("Recent badges could not be loaded.");
    } else {
      const claims = (claimData || []) as BadgeClaim[];
      const badgeIds = claims.map((claim) => claim.badge_id);
      const { data: badgeData, error: badgeError } = badgeIds.length
        ? await supabase.from("game_badges").select("*").in("id", badgeIds)
        : { data: [], error: null };
      const gameIds = [...new Set((badgeData || []).map((badge) => badge.game_id))];
      const { data: gameData, error: gameError } = gameIds.length
        ? await supabase.from("games").select(GAME_FIELDS).in("id", gameIds)
        : { data: [], error: null };
      if (badgeError || gameError) {
        setError("Recent badges could not be loaded.");
      } else {
        const badges = new Map((badgeData || []).map((badge) => [badge.id, badge]));
        const games = new Map(
          ((gameData || []) as GameRow[]).map((game) => [
            game.id,
            toCatalogueGame(game, (badgeData || []).filter((badge) => badge.game_id === game.id)),
          ]),
        );
        const next = claims.flatMap((claim) => {
          const badge = badges.get(claim.badge_id);
          const game = badge ? games.get(badge.game_id) : undefined;
          return badge && game ? [{ badge, game, earnedAt: claim.earned_at }] : [];
        });
        setRecentBadges((current) => (replace ? next : [...current, ...next]));
        setHasMore(claims.length > pageSize);
      }
    }
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [profileId]);

  useEffect(() => {
    setRecentBadges([]);
    void loadPage(0, true);
  }, [loadPage]);

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingIndicator label="Loading recent badges..." />
      </div>
    );
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;

  if (!recentBadges.length) {
    return (
      <div className="border-border bg-surface/75 rounded-xl border px-5 py-12 text-center">
        <FiAward className="text-accent-cold mx-auto h-7 w-7" />
        <h2 className="text-font-primary mt-3 font-serif text-2xl">
          No badges earned yet
        </h2>
        <p className="text-font-secondary mt-2 text-sm">
          Recent badges will appear here when this player completes a challenge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentBadges.map(({ badge, earnedAt, game }) => {
        const difficulty = BADGE_DIFFICULTY_DETAILS[badge.difficulty];
        return (
          <article
            key={`${badge.id}-${earnedAt}`}
            className="border-border bg-surface/75 hover:bg-surface-soft flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-colors max-sm:gap-2 max-sm:p-2.5"
          >
            <Link
              to={`/games/${game.id}`}
              className="focus-visible:ring-accent-cold flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:outline-none max-sm:gap-2"
            >
              <div
                className="border-border flex h-20 w-48 shrink-0 items-end rounded-lg border bg-cover bg-center p-2 max-sm:h-14 max-sm:w-20 max-sm:p-1.5"
                style={{ backgroundImage: `url(${game.bannerUrl})` }}
              >
                <span className="text-font-primary font-serif text-sm leading-none max-sm:text-xs">
                  {game.title}
                </span>
              </div>
              <img
                src={badgeIconUrl(badge)}
                alt=""
                className="bg-surface-raised h-14 w-14 shrink-0 rounded-full object-cover max-sm:h-11 max-sm:w-11"
              />
              <div className="min-w-0 flex-1">
                <p className="text-font-primary truncate text-sm font-medium">
                  {badge.name}
                </p>
                <p className="text-font-muted mt-1 truncate text-xs">
                  {badge.description}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span style={{ color: difficulty.color }}>
                    <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: difficulty.color }} />
                    {getBadgeTierLabel(badge.tier)} {difficulty.label}
                  </span>
                  <span className="text-font-secondary">{getBadgeExperience(badge.difficulty, badge.tier).toLocaleString()} EXP</span>
                </div>
              </div>
            </Link>
            {isOwnProfile && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void setPinnedBadge(pinnedBadgeId === badge.id ? null : badge.id)}
                className={`border-border shrink-0 rounded-lg border p-2 text-sm ${pinnedBadgeId === badge.id ? "bg-brand-secondary text-font-primary" : "text-font-secondary hover:bg-effect-glass hover:text-font-primary"}`}
                aria-label={pinnedBadgeId === badge.id ? "Unpin badge" : "Pin badge"}
              >
                <FaThumbtack className="h-3.5 w-3.5" />
              </button>
            )}
          </article>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={() => void loadPage(Math.floor(recentBadges.length / 12))}
          disabled={isLoadingMore}
          className="border-border text-font-secondary hover:text-font-primary mx-auto block rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingMore ? "Loading..." : "Show more"}
        </button>
      )}
    </div>
  );
}

export default RecentsPanel;
