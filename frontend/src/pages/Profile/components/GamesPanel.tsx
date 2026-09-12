import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { LoadingIndicator } from "../../../components";
import {
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  type BadgeDifficultyId,
  type CatalogueGame,
} from "../../../constants";
import { useGames } from "../../../hooks/useGames";
import { supabase } from "../../../utils/supabase";

type Difficulty = { label: string; earned: number; total: number };
type LibraryGame = {
  game: CatalogueGame;
  experience: string;
  progress: number;
  total: number;
  difficulties: Difficulty[];
};

function GameArt({ game }: { game: CatalogueGame }) {
  return (
    <div
      className="border-border flex h-20 w-48 shrink-0 items-end rounded-lg border bg-cover bg-center p-2"
      style={{ backgroundImage: `url(${game.bannerUrl})` }}
    >
      <span className="text-font-primary font-serif text-sm leading-none">
        {game.title}
      </span>
    </div>
  );
}

function DifficultyRows({
  gameId,
  difficulties,
}: {
  gameId: number;
  difficulties: Difficulty[];
}) {
  return (
    <div className="space-y-2">
      {difficulties.map(({ label, earned, total }) => {
        const percent = total ? Math.round((earned / total) * 100) : 0;
        const difficultyColor =
          BADGE_DIFFICULTY_DETAILS[label.toLowerCase() as BadgeDifficultyId]
            ?.color;
        return (
          <Link
            key={label}
            to={`/games/${gameId}?difficulty=${encodeURIComponent(label.toLowerCase())}`}
            className="hover:bg-effect-glass focus-visible:ring-accent-cold grid grid-cols-[5.5rem_3.25rem_minmax(4rem,1fr)] items-center gap-2 rounded px-1 py-0.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none sm:grid-cols-[7rem_3.5rem_minmax(6rem,1fr)]"
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
                className="bg-accent-cold h-full rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function GamesPanel({
  profileId,
  isOwnProfile,
}: {
  profileId: string;
  isOwnProfile: boolean;
}) {
  const { games: catalogueGames, isLoading: isGamesLoading } = useGames();
  const [libraryIds, setLibraryIds] = useState<number[] | null>(null);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<number[] | null>(null);
  const [expandedGame, setExpandedGame] = useState<number | null>(null);

  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("user_game_library")
      .select("game_id")
      .eq("user_id", profileId)
      .order("added_at", { ascending: false })
      .then(({ data }) => {
        if (isCurrent) setLibraryIds((data || []).map((item) => item.game_id));
      });

    return () => {
      isCurrent = false;
    };
  }, [profileId]);

  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", profileId)
      .then(({ data }) => {
        if (isCurrent) setEarnedBadgeIds((data || []).map((item) => item.badge_id));
      });
    return () => {
      isCurrent = false;
    };
  }, [profileId]);

  const games = useMemo<LibraryGame[]>(
    () => {
      const gameIds = new Set(libraryIds || []);

      catalogueGames.forEach((game) => {
        if (
          game.badges.some((badge) => earnedBadgeIds?.includes(badge.id))
        ) {
          gameIds.add(game.id);
        }
      });

      return [...gameIds]
        .map((id) => catalogueGames.find((game) => game.id === id))
        .filter((game): game is CatalogueGame => Boolean(game))
        .map((game) => {
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
            difficulties: game.difficulties.map(({ label, achievementCount }) => {
              const earned = earnedBadges.filter(
                (badge) =>
                  label.toLowerCase() === badge.difficulty,
              ).length;
              return { label, earned, total: achievementCount };
            }),
          };
        });
    },
    [catalogueGames, earnedBadgeIds, libraryIds],
  );

  if (libraryIds === null || earnedBadgeIds === null || isGamesLoading)
    return (
      <div className="py-12">
        <LoadingIndicator label="Loading games..." />
      </div>
    );
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
      {games.map(({ game, experience, progress, total, difficulties }) => {
        const isExpanded = expandedGame === game.id;
        return (
          <article
            key={game.id}
            className="border-border bg-surface/75 overflow-hidden rounded-xl border"
          >
            <div
              onClick={() => setExpandedGame(isExpanded ? null : game.id)}
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
                          className="bg-accent-cold h-full rounded-full"
                          style={{
                            width: `${total ? (progress / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-font-secondary shrink-0 text-xs">
                        {progress} of {total}
                      </span>
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
                <DifficultyRows gameId={game.id} difficulties={difficulties} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default GamesPanel;
