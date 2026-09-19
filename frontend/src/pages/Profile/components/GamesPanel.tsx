import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { FaMedal } from "react-icons/fa";
import { LoadingIndicator } from "../../../components";
import { PinnedBadgeDialog } from "./ProfileHeader";
import {
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  getBadgeTierLabel,
  type BadgeRow,
  type BadgeDifficultyId,
  type CatalogueGame,
} from "../../../constants";
import { fetchGamesPage } from "../../../hooks/useGames";
import { supabase } from "../../../utils/supabase";

type Difficulty = { label: string; earned: number; total: number };
const PROFILE_GAMES_PAGE_SIZE = 12;
type LibrarySort = "experience" | "progress";
type GameSortStats = { experience: number; earned: number; total: number };
type BadgeSortRow = Pick<
  BadgeRow,
  "id" | "game_id" | "difficulty" | "tier"
>;

const LIBRARY_SORT_OPTIONS: { value: LibrarySort; label: string }[] = [
  { value: "experience", label: "Earned EXP" },
  { value: "progress", label: "Badge progress" },
];
type LibraryGame = {
  game: CatalogueGame;
  experience: string;
  progress: number;
  total: number;
  difficulties: Difficulty[];
  earnedBadges: BadgeRow[];
};

function GameArt({ game }: { game: CatalogueGame }) {
  return (
    <div
      aria-label={game.title}
      className="h-20 w-48 shrink-0 rounded-lg bg-cover bg-center"
      style={{ backgroundImage: `url(${game.bannerUrl})` }}
    />
  );
}

function DifficultyRows({
  gameId,
  gameTitle,
  difficulties,
  earnedBadges,
  expandedDifficulty,
  onToggleDifficulty,
  onSelectBadge,
}: {
  gameId: number;
  gameTitle: string;
  difficulties: Difficulty[];
  earnedBadges: BadgeRow[];
  expandedDifficulty: BadgeDifficultyId | null;
  onToggleDifficulty: (difficulty: BadgeDifficultyId) => void;
  onSelectBadge: (badge: BadgeRow, gameTitle: string) => void;
}) {
  return (
    <div className="space-y-2">
      {difficulties.map(({ label, earned, total }) => {
        const percent = total ? Math.round((earned / total) * 100) : 0;
        const isComplete = total > 0 && earned === total;
        const difficultyColor =
          BADGE_DIFFICULTY_DETAILS[label.toLowerCase() as BadgeDifficultyId]
            ?.color;
        const difficultyId = label.toLowerCase() as BadgeDifficultyId;
        const isExpanded = expandedDifficulty === difficultyId;
        const claimedBadges = earnedBadges.filter(
          (badge) => badge.difficulty === difficultyId,
        );
        const detailsId = `game-${gameId}-${difficultyId}-badges`;
        return (
          <div key={label}>
            <button
              type="button"
              aria-controls={detailsId}
              aria-expanded={isExpanded}
              onClick={() => onToggleDifficulty(difficultyId)}
              className="hover:bg-effect-glass focus-visible:ring-accent-cold grid w-full grid-cols-[5.5rem_3.25rem_minmax(4rem,1fr)] items-center gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[7rem_3.5rem_minmax(6rem,1fr)]"
            >
              <span className="text-font-primary flex min-w-0 items-center gap-1.5 truncate">
                <i
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: difficultyColor }}
                />
                <span className="truncate">{label}</span>
              </span>
              <span className="text-font-muted text-right">
                {earned} / {total}
              </span>
              <div className="bg-surface-raised h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${isComplete ? "bg-linear-to-r from-[#78b159] via-[#fdcb58] to-[#aa8ed6]" : "bg-accent-cold"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </button>
            {isExpanded && (
              <div
                id={detailsId}
                className="mt-1.5"
              >
                {claimedBadges.length ? (
                  <ul className="divide-border divide-y">
                    {claimedBadges.map((badge) => (
                      <li key={badge.id}>
                        <button
                          type="button"
                          onClick={() => onSelectBadge(badge, gameTitle)}
                          className="hover:bg-effect-glass focus-visible:ring-accent-cold flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="text-font-primary flex min-w-0 items-center gap-2 truncate">
                              <i
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: BADGE_DIFFICULTY_DETAILS[badge.difficulty].color }}
                              />
                              <span className="truncate">{badge.name}</span>
                            </span>
                            <span className="text-font-muted mt-0.5 block truncate text-xs">
                              {badge.description}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-xs">
                            <span className="text-font-muted">
                              {getBadgeTierLabel(badge.tier)}
                            </span>
                            <span className="text-font-primary font-bold">
                              {getBadgeExperience(badge.difficulty, badge.tier).toLocaleString()} EXP
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-font-muted px-2 py-2 text-sm">
                    No {label.toLowerCase()} badges earned.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LibrarySortSelect({
  value,
  onChange,
}: {
  value: LibrarySort;
  onChange: (value: LibrarySort) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    LIBRARY_SORT_OPTIONS.find((option) => option.value === value) ||
    LIBRARY_SORT_OPTIONS[0];

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full sm:w-52">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`border-border bg-surface-soft text-font-primary focus:border-accent-cold flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm outline-none ${isOpen ? "border-accent-cold" : ""}`}
      >
        <span className="truncate">Sort: {selectedOption.label}</span>
        <FiChevronDown
          className={`text-font-muted ml-3 h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort library games"
          className="border-border bg-surface absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border p-1.5 shadow-black"
        >
          {LIBRARY_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm ${option.value === value ? "bg-brand-tertiary text-font-primary" : "text-font-secondary hover:bg-surface-soft hover:text-font-primary"}`}
            >
              <span className="min-w-0 truncate">{option.label}</span>
              {option.value === value && (
                <FiCheck className="h-4 w-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GamesPanel({
  profileId,
  profileName,
  isOwnProfile,
}: {
  profileId: string;
  profileName: string;
  isOwnProfile: boolean;
}) {
  const pageSize = PROFILE_GAMES_PAGE_SIZE;
  const [gameIds, setGameIds] = useState<number[] | null>(null);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<number[] | null>(null);
  const [gameSortStats, setGameSortStats] = useState<
    Map<number, GameSortStats> | null
  >(null);
  const [sort, setSort] = useState<LibrarySort>("experience");
  const [catalogueGames, setCatalogueGames] = useState<CatalogueGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(0);
  const [error, setError] = useState("");
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const [expandedDifficulty, setExpandedDifficulty] =
    useState<BadgeDifficultyId | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{
    badge: BadgeRow;
    gameTitle: string;
  } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError("");
    setGameSortStats(null);
    setExpandedGame(null);
    setExpandedDifficulty(null);
    Promise.all([
      supabase
        .from("user_game_library")
        .select("game_id")
        .eq("user_id", profileId)
        .order("added_at", { ascending: false }),
      supabase.from("user_badges").select("badge_id").eq("user_id", profileId),
    ]).then(
      async ([
        { data: libraryData, error: libraryError },
        { data: earnedData, error: earnedError },
      ]) => {
        if (!isCurrent) return;
        if (libraryError || earnedError) {
          setError("Games could not be loaded.");
          setIsLoading(false);
          return;
        }

        const earnedIds = (earnedData || []).map((item) => item.badge_id);
        const { data: badgeData, error: badgeError } = earnedIds.length
          ? await supabase
              .from("game_badges")
              .select("id, game_id, difficulty, tier")
              .in("id", earnedIds)
          : { data: [], error: null };
        if (!isCurrent) return;
        if (badgeError) {
          setError("Games could not be loaded.");
          setIsLoading(false);
          return;
        }

        const orderedGameIds = (libraryData || []).map((item) => item.game_id);
        const knownGameIds = new Set(orderedGameIds);
        (badgeData || []).forEach(({ game_id }) => {
          if (!knownGameIds.has(game_id)) {
            knownGameIds.add(game_id);
            orderedGameIds.push(game_id);
          }
        });
        const { data: allBadgeData, error: allBadgesError } =
          orderedGameIds.length
            ? await supabase
                .from("game_badges")
                .select("id, game_id, difficulty, tier")
                .in("game_id", orderedGameIds)
            : { data: [], error: null };
        if (!isCurrent) return;
        if (allBadgesError) {
          setError("Games could not be loaded.");
          setIsLoading(false);
          return;
        }
        const earnedBadgeIdSet = new Set(earnedIds);
        const sortStats = new Map<number, GameSortStats>();
        ((allBadgeData || []) as BadgeSortRow[]).forEach((badge) => {
          const current = sortStats.get(badge.game_id) || {
            experience: 0,
            earned: 0,
            total: 0,
          };
          current.total += 1;
          if (earnedBadgeIdSet.has(badge.id)) {
            current.earned += 1;
            current.experience += getBadgeExperience(
              badge.difficulty,
              badge.tier,
            );
          }
          sortStats.set(badge.game_id, current);
        });
        setGameIds(orderedGameIds);
        setEarnedBadgeIds(earnedIds);
        setGameSortStats(sortStats);
        setCatalogueGames([]);
        setNextPage(0);
        setHasMore(false);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [profileId]);

  const sortedGameIds = useMemo(() => {
    if (gameIds === null || gameSortStats === null) return null;
    return gameIds
      .map((gameId, index) => ({ gameId, index }))
      .sort((left, right) => {
        const leftStats = gameSortStats.get(left.gameId) || {
          experience: 0,
          earned: 0,
          total: 0,
        };
        const rightStats = gameSortStats.get(right.gameId) || {
          experience: 0,
          earned: 0,
          total: 0,
        };
        const leftValue =
          sort === "experience"
            ? leftStats.experience
            : leftStats.total
              ? leftStats.earned / leftStats.total
              : 0;
        const rightValue =
          sort === "experience"
            ? rightStats.experience
            : rightStats.total
              ? rightStats.earned / rightStats.total
              : 0;
        return rightValue - leftValue || left.index - right.index;
      })
      .map(({ gameId }) => gameId);
  }, [gameIds, gameSortStats, sort]);

  const loadPage = useCallback(
    async (page: number, replace = false) => {
      if (!sortedGameIds) return;
      const pageIds = sortedGameIds.slice(
        page * pageSize,
        (page + 1) * pageSize,
      );
      if (replace) setIsLoading(true);
      else setIsLoadingMore(true);
      setError("");
      try {
        const { games: loadedGames } = await fetchGamesPage({
          gameIds: pageIds,
          pageSize,
        });
        const gamesById = new Map(loadedGames.map((game) => [game.id, game]));
        const orderedGames = pageIds.flatMap((gameId) => {
          const game = gamesById.get(gameId);
          return game ? [game] : [];
        });
        setCatalogueGames((current) =>
          replace ? orderedGames : [...current, ...orderedGames],
        );
        setNextPage(page + 1);
        setHasMore((page + 1) * pageSize < sortedGameIds.length);
      } catch {
        setError("Games could not be loaded.");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize, sortedGameIds],
  );

  useEffect(() => {
    if (sortedGameIds === null) return;
    void loadPage(0, true);
  }, [loadPage, sortedGameIds]);

  const games = useMemo<LibraryGame[]>(() => {
    return catalogueGames.map((game) => {
      const earnedBadges = game.badges.filter((badge) =>
        earnedBadgeIds?.includes(badge.id),
      );
      const earnedExp = earnedBadges.reduce(
        (total, badge) =>
          total + getBadgeExperience(badge.difficulty, badge.tier),
        0,
      );
      return {
        game,
        experience: `EXP ${earnedExp.toLocaleString()} / ${game.totalExp.toLocaleString()}`,
        progress: earnedBadges.length,
        total: game.badges.length,
        earnedBadges,
        difficulties: game.difficulties.map(({ label, achievementCount }) => {
          const earned = earnedBadges.filter(
            (badge) => label.toLowerCase() === badge.difficulty,
          ).length;
          return { label, earned, total: achievementCount };
        }),
      };
    });
  }, [catalogueGames, earnedBadgeIds]);

  if (
    gameIds === null ||
    earnedBadgeIds === null ||
    gameSortStats === null ||
    isLoading
  )
    return (
      <div className="py-12">
        <LoadingIndicator label="Loading games..." />
      </div>
    );
  if (error) return <p className="text-destructive text-sm">{error}</p>;

  if (!games.length)
    return (
      <div className="border-border bg-surface/75 rounded-xl border px-5 py-12 text-center">
        <h2 className="text-font-primary font-serif text-2xl">
          {isOwnProfile
            ? "Your library is empty"
            : "No games in this library yet"}
        </h2>
        <p className="text-font-secondary mt-2 text-sm">
          {isOwnProfile
            ? "Browse the catalogue to add your first game."
            : "Check back when this player adds a game."}
        </p>
        {isOwnProfile && (
          <Link
            to="/games"
            className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-5 inline-flex rounded-lg px-3 py-2 text-sm font-medium"
          >
            Browse games
          </Link>
        )}
      </div>
    );

  return (
    <div className="space-y-3">
      <LibrarySortSelect value={sort} onChange={setSort} />
      {games.map(({ game, experience, progress, total, difficulties, earnedBadges }) => {
        const isExpanded = expandedGame === game.id;
        const isComplete = total > 0 && progress === total;
        return (
          <article
            key={game.id}
            className="bg-surface/75 overflow-hidden rounded-xl"
          >
            <div
              onClick={() => {
                setExpandedGame(isExpanded ? null : game.id);
                setExpandedDifficulty(null);
              }}
              className="hover:bg-effect-glass flex cursor-pointer items-center gap-3 p-3 transition-colors sm:gap-4"
            >
              <Link
                to={`/games/${game.id}`}
                onClick={(event) => event.stopPropagation()}
                className="focus-visible:ring-accent-cold cursor-pointer rounded-lg focus-visible:ring-2"
              >
                <GameArt game={game} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/games/${game.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="text-font-primary hover:text-hover focus-visible:ring-accent-cold cursor-pointer truncate font-medium focus-visible:ring-2"
                >
                  {game.title}
                </Link>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpandedGame(isExpanded ? null : game.id);
                    setExpandedDifficulty(null);
                  }}
                  className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-font-secondary text-sm">{experience}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-font-muted shrink-0 text-xs">
                        Badge progress
                      </span>
                      <div className="bg-surface-raised h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full ${isComplete ? "bg-linear-to-r from-[#78b159] via-[#fdcb58] to-[#aa8ed6]" : "bg-accent-cold"}`}
                          style={{
                            width: `${total ? (progress / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-font-secondary shrink-0 text-xs">
                        {progress} of {total}
                      </span>
                      {isComplete && <FaMedal aria-label="All badges completed" className="h-9 w-9 shrink-0 text-accent-cold drop-shadow-[0_0_8px_rgba(61,142,240,0.45)]" />}
                    </div>
                  </div>
                  <FiChevronDown
                    className={`text-font-secondary h-5 w-5 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="border-border bg-surface-soft/50 border-t p-4">
                <DifficultyRows
                  gameId={game.id}
                  gameTitle={game.title}
                  difficulties={difficulties}
                  earnedBadges={earnedBadges}
                  expandedDifficulty={expandedDifficulty}
                  onToggleDifficulty={(difficulty) => {
                    setExpandedDifficulty((current) =>
                      current === difficulty ? null : difficulty,
                    );
                  }}
                  onSelectBadge={(badge, gameTitle) =>
                    setSelectedBadge({ badge, gameTitle })
                  }
                />
              </div>
            )}
          </article>
        );
      })}
      {hasMore && (
        <button
          type="button"
          onClick={() => void loadPage(nextPage)}
          disabled={isLoadingMore}
          className="border-border text-font-secondary hover:text-font-primary mx-auto block rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingMore ? "Loading..." : "Show more"}
        </button>
      )}
      {selectedBadge && (
        <PinnedBadgeDialog
          profileName={profileName}
          badge={selectedBadge.badge}
          gameTitle={selectedBadge.gameTitle}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
}

export default GamesPanel;
