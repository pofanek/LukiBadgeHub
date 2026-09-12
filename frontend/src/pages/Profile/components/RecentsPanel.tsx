import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import { LoadingIndicator } from "../../../components";
import {
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  getBadgeTierLabel,
  type BadgeRow,
  type CatalogueGame,
} from "../../../constants";
import { useGames } from "../../../hooks/useGames";
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

function RecentsPanel({ profileId }: { profileId: string }) {
  const { games, isLoading: isGamesLoading } = useGames();
  const [claims, setClaims] = useState<BadgeClaim[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setClaims(null);
    setError("");
    supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", profileId)
      .order("earned_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!isCurrent) return;
        if (queryError) {
          setError("Recent badges could not be loaded.");
          setClaims([]);
          return;
        }
        setClaims((data || []) as BadgeClaim[]);
      });

    return () => {
      isCurrent = false;
    };
  }, [profileId]);

  const recentBadges = useMemo<RecentBadge[]>(
    () =>
      (claims || []).flatMap((claim) => {
        const game = games.find((candidate) =>
          candidate.badges.some((badge) => badge.id === claim.badge_id),
        );
        const badge = game?.badges.find((item) => item.id === claim.badge_id);
        return game && badge ? [{ game, badge, earnedAt: claim.earned_at }] : [];
      }),
    [claims, games],
  );

  if (claims === null || isGamesLoading) {
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
          <Link
            key={`${badge.id}-${earnedAt}`}
            to={`/games/${game.id}`}
            className="border-border bg-surface/75 hover:bg-surface-soft focus-visible:ring-accent-cold flex min-w-0 items-center gap-3 rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <div
              className="border-border flex h-20 w-48 shrink-0 items-end rounded-lg border bg-cover bg-center p-2"
              style={{ backgroundImage: `url(${game.bannerUrl})` }}
            >
              <span className="text-font-primary font-serif text-sm leading-none">
                {game.title}
              </span>
            </div>
            <img
              src={badgeIconUrl(badge)}
              alt=""
              className="bg-surface-raised h-14 w-14 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-font-primary truncate text-sm font-medium">
                {badge.name}
              </p>
              <p className="text-font-muted mt-1 truncate text-xs">
                {badge.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span style={{ color: difficulty.color }}>
                  <i
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: difficulty.color }}
                  />
                  {getBadgeTierLabel(badge.tier)} {difficulty.label}
                </span>
                <span className="text-font-secondary">
                  {getBadgeExperience(badge.difficulty, badge.tier).toLocaleString()} EXP
                </span>
                <span className="text-font-muted">
                  {new Intl.DateTimeFormat(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(earnedAt))}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default RecentsPanel;
