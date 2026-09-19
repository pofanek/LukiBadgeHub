import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiAward, FiBookOpen, FiChevronDown, FiTrendingUp, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { LoadingIndicator } from "../../../components";
import { PinnedBadgeDialog } from "./ProfileHeader";
import {
  BADGE_DIFFICULTIES,
  BADGE_TIERS,
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  getBadgeTierLabel,
  type BadgeDifficultyId,
  type BadgeRow,
  type CatalogueGame,
} from "../../../constants";
import { useGames } from "../../../hooks/useGames";
import { getLevelProgress } from "../../../utils/leveling";
import { supabase } from "../../../utils/supabase";
import { mediaUrl } from "../../../utils/media";

type StatsData = {
  claims: { badge_id: number }[];
  libraryIds: number[];
  currentRank: number | null;
  bestRank: { best_rank: number; achieved_at: string } | null;
};

function StatsPanel({
  profileId,
  profileName,
}: {
  profileId: string;
  profileName: string;
}) {
  const { games, isLoading: isGamesLoading } = useGames();
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<BadgeDifficultyId | null>(null);
  const [expandedBadgeId, setExpandedBadgeId] = useState<number | null>(null);
  const [selectedHardestBadge, setSelectedHardestBadge] = useState<{
    badge: BadgeRow;
    game: CatalogueGame;
  } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    queueMicrotask(() => {
      if (!isCurrent) return;
      setData(null);
      setError("");
    });

    Promise.all([
      supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", profileId),
      supabase
        .from("user_game_library")
        .select("game_id")
        .eq("user_id", profileId),
      supabase.rpc("get_leaderboard_position", {
        p_board: "experience",
        p_difficulty: null,
        p_profile_id: profileId,
      }),
      supabase
        .from("leaderboard_best_positions")
        .select("best_rank, achieved_at")
        .eq("profile_id", profileId)
        .maybeSingle(),
    ]).then(([claimsResult, libraryResult, currentRankResult, bestRankResult]) => {
      if (!isCurrent) return;
      if (claimsResult.error || libraryResult.error || currentRankResult.error || bestRankResult.error) {
        setError("Profile statistics could not be loaded.");
        setData({ claims: [], libraryIds: [], currentRank: null, bestRank: null });
        return;
      }
      setData({
        claims: claimsResult.data || [],
        libraryIds: (libraryResult.data || []).map((entry) => entry.game_id),
        currentRank: (currentRankResult.data || [])[0]?.player_rank || null,
        bestRank: bestRankResult.data,
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
    const earnedBadgeDetails = claimedGames.flatMap((game) =>
      game.badges
        .filter((badge) => claimedBadgeIds.has(badge.id))
        .map((badge) => ({ badge, game })),
    );
    const earnedExp = earnedBadges.reduce(
      (total, badge) =>
        total + getBadgeExperience(badge.difficulty, badge.tier),
      0,
    );
    const gameProgress = claimedGames.map((game) => {
      const earned = game.badges.filter((badge) => claimedBadgeIds.has(badge.id));
      const experience = earned.reduce((total, badge) => total + getBadgeExperience(badge.difficulty, badge.tier), 0);
      return { game, earned: earned.length, total: game.badges.length, experience };
    });
    return {
      earnedBadges,
      earnedBadgeDetails,
      earnedExp,
      playedGames: playedGames.size,
      difficulties: BADGE_DIFFICULTIES.map((id) => {
        const earned = earnedBadges.filter(
          (badge) => badge.difficulty === id,
        ).length;
        return { id, earned };
      }),
      hardestBadges: [...earnedBadgeDetails].sort(({ badge: left }, { badge: right }) => BADGE_DIFFICULTIES.indexOf(right.difficulty) - BADGE_DIFFICULTIES.indexOf(left.difficulty) || BADGE_TIERS.indexOf(right.tier) - BADGE_TIERS.indexOf(left.tier)).slice(0, 5),
      topExperienceGames: [...gameProgress].sort((left, right) => right.experience - left.experience || left.game.title.localeCompare(right.game.title)).slice(0, 3),
      topCompletionGames: [...gameProgress].filter(({ total }) => total > 0).sort((left, right) => right.earned / right.total - left.earned / left.total || right.earned - left.earned || left.game.title.localeCompare(right.game.title)).slice(0, 3),
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
    {
      label: "Current leaderboard position",
      value: data.currentRank ? `#${data.currentRank.toLocaleString()}` : "—",
      Icon: FiTrendingUp,
    },
    {
      label: "Highest leaderboard position",
      value: data.bestRank ? `#${data.bestRank.best_rank.toLocaleString()}` : "—",
      description: data.bestRank
        ? `Achieved ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(data.bestRank.achieved_at))}`
        : undefined,
      Icon: FiAward,
    },
  ];
  const highestDifficultyCount = Math.max(
    ...stats.difficulties.map(({ earned }) => earned),
    1,
  );
  const levelProgress = getLevelProgress(stats.earnedExp);
  const selectedDifficultyDetails = selectedDifficulty
    ? BADGE_DIFFICULTY_DETAILS[selectedDifficulty]
    : null;
  const badgesByGame: Map<number, { game: CatalogueGame; badges: BadgeRow[] }> = selectedDifficulty
    ? stats.earnedBadgeDetails
        .filter(({ badge }) => badge.difficulty === selectedDifficulty)
        .reduce<Map<number, { game: CatalogueGame; badges: BadgeRow[] }>>(
          (grouped, { game, badge }) => {
            const group = grouped.get(game.id) || { game, badges: [] };
            group.badges.push(badge);
            grouped.set(game.id, group);
            return grouped;
          },
          new Map(),
        )
    : new Map();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
        <div>
          <h2 className="text-font-primary font-serif text-2xl">
            Hardest badges earned
          </h2>
          <p className="text-font-muted mt-1 text-sm">
            The five highest-difficulty badges on this profile.
          </p>
        </div>
        {stats.hardestBadges.length ? (
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.hardestBadges.map(({ badge, game }) => {
              const difficulty = BADGE_DIFFICULTY_DETAILS[badge.difficulty];
              return (
                <li key={badge.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedHardestBadge({ badge, game })}
                    className="border-border bg-surface-soft hover:border-accent-cold hover:bg-effect-glass focus-visible:ring-accent-cold flex h-full w-full flex-col items-center rounded-lg border p-3 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <img
                      src={mediaUrl(badge.icon_path) || difficulty.icon}
                      alt=""
                      className="bg-surface-raised h-16 w-16 rounded-full object-cover"
                    />
                    <span className="text-font-primary mt-3 w-full truncate text-sm font-medium">
                      {badge.name}
                    </span>
                    <span className="text-font-muted mt-1 w-full truncate text-xs">
                      {game.title}
                    </span>
                    <span
                      className="mt-2 text-xs"
                      style={{ color: difficulty.color }}
                    >
                      {getBadgeTierLabel(badge.tier)} {difficulty.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-font-muted mt-4 text-sm">No badges earned yet.</p>
        )}
      </section>
      <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-font-primary font-serif text-3xl sm:text-4xl">
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
        <dl className="divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
          {overview.map(({ label, value, description, Icon }) => (
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
                {description && <p className="text-font-muted mt-1 text-xs">{description}</p>}
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
        <h2 className="text-font-primary font-serif text-2xl">Top games</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <GameStatList
            title="Most EXP earned"
            entries={stats.topExperienceGames}
            value={(entry) => `${entry.experience.toLocaleString()} EXP`}
          />
          <GameStatList
            title="Highest badge completion"
            entries={stats.topCompletionGames}
            value={(entry) =>
              `${entry.earned} / ${entry.total} badges · ${Math.round((entry.earned / entry.total) * 100)}%`
            }
          />
        </div>
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
              <div key={id} className="flex h-full min-w-0 flex-col text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDifficulty(id);
                    setExpandedBadgeId(null);
                  }}
                  className="hover:bg-effect-glass focus-visible:ring-accent-cold flex min-h-0 flex-1 flex-col justify-end rounded-lg px-1 outline-none transition-colors focus-visible:ring-2"
                  aria-label={`Show ${earned} ${difficulty.label} badges`}
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
                </button>
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
      {selectedDifficulty && selectedDifficultyDetails && createPortal(
        <div
          className="bg-surface-overlay/80 fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onClick={() => setSelectedDifficulty(null)}
        >
          <div
            className="border-border bg-surface-raised max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border p-5 shadow-black sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="difficulty-badges-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-accent-cold text-sm font-medium">Earned badges</p>
                <h2 id="difficulty-badges-title" className="text-font-primary mt-1 font-serif text-3xl">
                  {selectedDifficultyDetails.label}
                </h2>
              </div>
              <button type="button" onClick={() => setSelectedDifficulty(null)} className="text-font-muted hover:text-font-primary rounded p-1" aria-label="Close badge list">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {badgesByGame.size === 0 ? (
              <p className="text-font-secondary mt-6 text-sm">No {selectedDifficultyDetails.label} badges earned yet.</p>
            ) : (
              <div className="mt-6 space-y-5">
                {[...badgesByGame.values()].map(({ game, badges }) => (
                  <section key={game.id}>
                    <h3 className="text-font-primary font-serif text-xl">{game.title}</h3>
                    <div className="mt-2 space-y-2">
                      {badges.map((badge) => {
                        const isExpanded = expandedBadgeId === badge.id;
                        return <div key={badge.id} className="border-border bg-surface-soft overflow-hidden rounded-lg border">
                          <button type="button" onClick={() => setExpandedBadgeId(isExpanded ? null : badge.id)} aria-expanded={isExpanded} className="hover:bg-effect-glass focus-visible:ring-accent-cold flex w-full items-center gap-3 p-3 text-left outline-none transition-colors focus-visible:ring-2">
                            <img src={mediaUrl(badge.icon_path) || selectedDifficultyDetails.icon} alt="" className="bg-surface-raised h-10 w-10 shrink-0 rounded-full object-cover" />
                            <span className="min-w-0 flex-1"><span className="text-font-primary block truncate text-sm font-medium">{badge.name}</span><span className="text-font-muted mt-0.5 block text-xs">{getBadgeTierLabel(badge.tier)} {selectedDifficultyDetails.label}</span></span>
                            <FiChevronDown className={`text-font-muted h-4 w-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {isExpanded && <p className="border-border text-font-secondary border-t px-3 py-3 text-sm leading-relaxed">{badge.description || "No description provided."}</p>}
                        </div>;
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
      {selectedHardestBadge && (
        <PinnedBadgeDialog
          profileName={profileName}
          badge={selectedHardestBadge.badge}
          gameTitle={selectedHardestBadge.game.title}
          onClose={() => setSelectedHardestBadge(null)}
        />
      )}
    </div>
  );
}

function GameStatList({ title, entries, value }: { title: string; entries: { game: CatalogueGame; earned: number; total: number; experience: number }[]; value: (entry: { game: CatalogueGame; earned: number; total: number; experience: number }) => string }) {
  return (
    <div>
      <h3 className="text-font-primary text-sm font-medium">{title}</h3>
      {entries.length ? (
        <ol className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.game.id}>
              <Link
                to={`/games/${entry.game.id}`}
                className="border-border bg-surface-soft hover:border-accent-cold hover:bg-effect-glass focus-visible:ring-accent-cold flex items-center gap-3 rounded-lg border p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="h-10 w-16 shrink-0 rounded bg-cover bg-center"
                  style={{ backgroundImage: `url(${entry.game.bannerUrl})` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="text-font-primary block truncate text-sm font-medium">
                    {entry.game.title}
                  </span>
                  <span className="text-font-muted mt-0.5 block text-xs">
                    {value(entry)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-font-muted mt-3 text-sm">No game progress yet.</p>
      )}
    </div>
  );
}

export default StatsPanel;
