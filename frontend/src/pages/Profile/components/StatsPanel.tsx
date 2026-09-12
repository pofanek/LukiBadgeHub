import { useEffect, useMemo, useState } from "react";
import { FiAward, FiBookOpen, FiTrendingUp } from "react-icons/fi";
import { LoadingIndicator } from "../../../components";
import {
  BADGE_DIFFICULTIES,
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  type BadgeRow,
  type CatalogueGame,
} from "../../../constants";
import { useGames } from "../../../hooks/useGames";
import { getLevelProgress } from "../../../utils/leveling";
import { supabase } from "../../../utils/supabase";

type StatsData = {
  claims: { badge_id: number }[];
  libraryIds: number[];
};

function StatsPanel({ profileId }: { profileId: string }) {
  const { games, isLoading: isGamesLoading } = useGames();
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    setData(null);
    setError("");

    Promise.all([
      supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", profileId),
      supabase
        .from("user_game_library")
        .select("game_id")
        .eq("user_id", profileId),
    ]).then(([claimsResult, libraryResult]) => {
      if (!isCurrent) return;
      if (claimsResult.error || libraryResult.error) {
        setError("Profile statistics could not be loaded.");
        setData({ claims: [], libraryIds: [] });
        return;
      }
      setData({
        claims: claimsResult.data || [],
        libraryIds: (libraryResult.data || []).map((entry) => entry.game_id),
      });
    });

    return () => {
      isCurrent = false;
    };
  }, [profileId]);

  const stats = useMemo(() => {
    const libraryGameIds = new Set(data?.libraryIds || []);
    const claimedBadgeIds = new Set(
      (data?.claims || []).map((claim) => claim.badge_id),
    );
    const claimedGames = games.filter((game) =>
      game.badges.some((badge) => claimedBadgeIds.has(badge.id)),
    );
    const playedGames = new Map<number, CatalogueGame>();
    games.forEach((game) => {
      if (libraryGameIds.has(game.id)) playedGames.set(game.id, game);
    });
    claimedGames.forEach((game) => playedGames.set(game.id, game));

    const availableBadges = [...playedGames.values()].flatMap(
      (game) => game.badges,
    );
    const badgeById = new Map<number, BadgeRow>(
      availableBadges.map((badge) => [badge.id, badge]),
    );
    const earnedBadges = [...claimedBadgeIds]
      .map((id) => badgeById.get(id))
      .filter((badge): badge is BadgeRow => Boolean(badge));
    const earnedExp = earnedBadges.reduce(
      (total, badge) =>
        total + getBadgeExperience(badge.difficulty, badge.tier),
      0,
    );
    return {
      earnedBadges,
      earnedExp,
      playedGames: playedGames.size,
      difficulties: BADGE_DIFFICULTIES.map((id) => {
        const earned = earnedBadges.filter(
          (badge) => badge.difficulty === id,
        ).length;
        return { id, earned };
      }),
    };
  }, [data, games]);

  if (data === null || isGamesLoading) {
    return (
      <div className="py-12">
        <LoadingIndicator label="Loading profile statistics..." />
      </div>
    );
  }

  if (error) return <p className="text-destructive text-sm">{error}</p>;

  const overview = [
    {
      label: "Total Badges earned",
      value: stats.earnedBadges.length.toLocaleString(),
      Icon: FiAward,
    },
    {
      label: "Total EXP earned",
      value: stats.earnedExp.toLocaleString(),
      Icon: FiTrendingUp,
    },
    {
      label: "Total Games played",
      value: stats.playedGames.toLocaleString(),
      Icon: FiBookOpen,
    },
  ];
  const highestDifficultyCount = Math.max(
    ...stats.difficulties.map(({ earned }) => earned),
    1,
  );
  const levelProgress = getLevelProgress(stats.earnedExp);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-font-primary font-serif text-2xl">
              Level {levelProgress.level}
            </h2>
            <p className="text-font-secondary mt-1 text-sm">
              {levelProgress.experienceRemaining.toLocaleString()} EXP to Level{" "}
              {levelProgress.level + 1}
            </p>
          </div>
          <p className="text-font-muted text-sm">
            {levelProgress.experienceIntoLevel.toLocaleString()} /{" "}
            {levelProgress.experienceToNextLevel.toLocaleString()} EXP
          </p>
        </div>
        <div
          aria-label={`${levelProgress.experienceIntoLevel.toLocaleString()} of ${levelProgress.experienceToNextLevel.toLocaleString()} EXP toward Level ${levelProgress.level + 1}`}
          aria-valuemax={levelProgress.experienceToNextLevel}
          aria-valuemin={0}
          aria-valuenow={levelProgress.experienceIntoLevel}
          className="bg-surface-overlay mt-4 h-2.5 overflow-hidden rounded-full"
          role="progressbar"
        >
          <div
            className="bg-accent-cold h-full rounded-full"
            style={{ width: `${levelProgress.progressPercentage}%` }}
          />
        </div>
      </section>
      <section className="border-border bg-surface/75 overflow-hidden rounded-xl border">
        <dl className="divide-border grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {overview.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4 sm:block sm:p-5">
              <div className="bg-surface-raised/70 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:mb-5">
                <Icon className="text-accent-cold h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <dd className="text-font-primary font-serif text-3xl leading-none sm:text-4xl">
                  {value}
                </dd>
                <dt className="text-font-secondary mt-1.5 text-sm font-medium">
                  {label}
                </dt>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
        <div>
          <h2 className="text-font-primary font-serif text-2xl">
            Badges by difficulty
          </h2>
          <p className="text-font-muted mt-1 text-sm">
            The badges this player has earned at each difficulty.
          </p>
        </div>
        <div className="mt-8 grid h-64 grid-cols-6 items-end gap-1.5 sm:gap-4">
          {stats.difficulties.map(({ id, earned }) => {
            const difficulty = BADGE_DIFFICULTY_DETAILS[id];
            const height = (earned / highestDifficultyCount) * 100;
            return (
              <div
                key={id}
                className="flex h-full min-w-0 flex-col justify-end text-center"
              >
                <span className="text-font-primary mb-2 text-xs font-medium tabular-nums">
                  {earned}
                </span>
                <div
                  className="min-h-1 rounded-t-sm opacity-90"
                  style={{
                    backgroundColor: difficulty.color,
                    height: `${height}%`,
                  }}
                />
                <img
                  src={difficulty.icon}
                  alt=""
                  className="mx-auto mt-3 h-8 w-8 object-contain sm:h-10 sm:w-10"
                />
                <span className="text-font-muted mt-1.5 block w-full whitespace-nowrap text-xs sm:text-sm">
                  {difficulty.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default StatsPanel;
