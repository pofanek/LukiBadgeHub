import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiCheck,
  FiChevronDown,
  FiPlus,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { LoadingIndicator } from "../../components";
import type { CatalogueGame } from "../../constants";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useGames } from "../../hooks/useGames";
import { supabase } from "../../utils/supabase";

type SortOption = "name" | "release";

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-[#46c85a]",
  Medium: "bg-accent-cold",
  Hard: "bg-destructive",
  Extreme: "bg-[#e84f81]",
  Supreme: "bg-hover",
  Inhuman: "bg-font-muted",
};

const SORT_LABELS: Record<SortOption, string> = {
  name: "Name",
  release: "Release date",
};

function Games() {
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const { games, isLoading: isGamesLoading, error: gamesError } = useGames();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [libraryIds, setLibraryIds] = useState<number[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<number | null>(null);
  const [libraryError, setLibraryError] = useState("");

  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "all";
  const scope = searchParams.get("scope") === "library" ? "library" : "all";
  const sort = (searchParams.get("sort") || "release") as SortOption;
  const selectedSort = Object.hasOwn(SORT_LABELS, sort) ? sort : "release";
  const genres = useMemo(
    () => [...new Set(games.flatMap((game) => game.genres))].sort(),
    [games],
  );
  const activeLibraryIds = useMemo(
    () => (user ? libraryIds : []),
    [libraryIds, user],
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) setIsLibraryLoading(true);
    });
    supabase
      .from("user_game_library")
      .select("game_id")
      .then(({ data, error }) => {
        if (!active) return;
        setIsLibraryLoading(false);
        if (error) {
          setLibraryError("Your library could not be loaded.");
          return;
        }
        setLibraryIds((data || []).map((item) => item.game_id));
      });

    return () => {
      active = false;
    };
  }, [user]);

  const visibleGames = useMemo(
    () =>
      games
        .filter((game) =>
          game.title.toLowerCase().includes(query.toLowerCase()),
        )
        .filter((game) => genre === "all" || game.genres.includes(genre))
        .filter((game) => scope === "all" || activeLibraryIds.includes(game.id))
        .sort((left, right) => {
          if (selectedSort === "name")
            return left.title.localeCompare(right.title);
          if (selectedSort === "release")
            return right.releaseYear - left.releaseYear;
          return left.title.localeCompare(right.title);
        }),
    [activeLibraryIds, games, genre, query, scope, selectedSort],
  );

  const updateFilters = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (
        !value ||
        value === "all" ||
        (key === "sort" && value === "release")
      )
        next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => setSearchParams({}, { replace: true });

  const toggleLibrary = async (gameId: number) => {
    setLibraryError("");
    if (!user) {
      window.sessionStorage.setItem(
        "luki-post-login-path",
        `${window.location.pathname}${window.location.search}`,
      );
      navigate("/login");
      return;
    }

    const isInLibrary = libraryIds.includes(gameId);
    setPendingGameId(gameId);
    const { error } = isInLibrary
      ? await supabase
          .from("user_game_library")
          .delete()
          .eq("user_id", user.id)
          .eq("game_id", gameId)
      : await supabase
          .from("user_game_library")
          .insert({ user_id: user.id, game_id: gameId });

    setPendingGameId(null);
    if (error) {
      setLibraryError("The library could not be updated. Please try again.");
      return;
    }
    setLibraryIds((current) =>
      isInLibrary
        ? current.filter((id) => id !== gameId)
        : [...current, gameId],
    );
  };

  return (
    <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-7">
        <header className="border-border border-b pb-6 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <div>
            <h1 className="text-font-primary font-serif text-4xl sm:text-5xl">
              Browse games
            </h1>
            <p className="text-font-secondary mt-2 max-w-2xl leading-relaxed">
              Find your next challenge, compare its badge path, and keep the
              games you want in your library.
            </p>
          </div>
          <p className="text-font-muted mt-4 text-sm sm:mt-0">
            {visibleGames.length} {visibleGames.length === 1 ? "game" : "games"}
          </p>
        </header>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="border-border bg-surface-soft focus-within:border-accent-cold flex h-11 w-full items-center gap-3 rounded-lg border px-3 lg:max-w-md">
            <FiSearch className="text-font-muted h-5 w-5 shrink-0" />
            <span className="sr-only">Search games</span>
            <input
              value={query}
              onChange={(event) => updateFilters({ q: event.target.value })}
              placeholder="Search games"
              className="text-font-primary placeholder:text-font-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateFilters({ q: null })}
                className="text-font-muted hover:text-font-primary"
                aria-label="Clear game search"
              >
                <FiX />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Library"
              value={scope}
              onChange={(value) => updateFilters({ scope: value })}
              options={[
                { value: "all", label: "All games" },
                { value: "library", label: "In your library" },
              ]}
            />
            <FilterSelect
              label="Genre"
              value={genre}
              onChange={(value) => updateFilters({ genre: value })}
              options={[
                { value: "all", label: "All genres" },
                ...genres.map((value) => ({ value, label: value })),
              ]}
            />
            <FilterSelect
              label="Sort by"
              value={selectedSort}
              onChange={(value) => updateFilters({ sort: value })}
              options={Object.entries(SORT_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
        </div>

        {(libraryError || gamesError) && (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {libraryError || gamesError}
          </p>
        )}
        {isAuthLoading || isGamesLoading || (user && isLibraryLoading) ? (
          <div className="py-20">
            <LoadingIndicator label="Loading games..." />
          </div>
        ) : visibleGames.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {visibleGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isInLibrary={activeLibraryIds.includes(game.id)}
                isPending={pendingGameId === game.id}
                onToggleLibrary={toggleLibrary}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-surface/75 mt-6 rounded-xl border px-5 py-14 text-center">
            <FiSliders className="text-accent-cold mx-auto h-7 w-7" />
            <h2 className="text-font-primary mt-4 font-serif text-2xl">
              No games match these filters
            </h2>
            <p className="text-font-secondary mx-auto mt-2 max-w-md text-sm leading-relaxed">
              Try another title or clear your filters to see the full catalogue.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-5 rounded-lg px-3 py-2 text-sm font-medium"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
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

  const selectOption = (option: { value: string; label: string }) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-32">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`border-border bg-surface-soft text-font-primary focus:border-accent-cold flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-left text-sm outline-none ${isOpen ? "border-accent-cold" : ""}`}
      >
        <span className="min-w-0 flex-1 truncate">
          {label === "Sort by"
            ? `Sort: ${selectedOption.label}`
            : selectedOption.label}
        </span>
        <FiChevronDown
          className={`text-font-muted h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="border-border bg-surface absolute z-20 mt-1.5 min-w-full overflow-hidden rounded-xl border p-1.5 shadow-black"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => selectOption(option)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm whitespace-nowrap ${option.value === value ? "bg-brand-tertiary text-font-primary" : "text-font-secondary hover:bg-surface-soft hover:text-font-primary"}`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {label === "Sort by" ? `Sort: ${option.label}` : option.label}
                </span>
                {option.value === value && (
                  <FiCheck className="h-4 w-4 shrink-0" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GameCard({
  game,
  isInLibrary,
  isPending,
  onToggleLibrary,
}: {
  game: CatalogueGame;
  isInLibrary: boolean;
  isPending: boolean;
  onToggleLibrary: (gameId: number) => void;
}) {
  return (
    <article className="group border-border bg-surface rounded-xl border shadow-black">
      <Link
        to={`/games/${game.id}`}
        className="focus-visible:outline-accent-cold relative block aspect-[3/4] overflow-visible focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <div className="absolute inset-0 overflow-hidden rounded-t-xl">
          <img
            src={game.cover}
            alt=""
            className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
            style={{ objectPosition: game.coverPosition }}
          />
          <div className="from-surface-overlay via-surface-overlay/30 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-3 pt-12">
            <h2 className={`text-font-primary truncate font-serif text-lg ${game.achievementCount ? "mt-5" : ""}`}>
              {game.title}
            </h2>
            {game.achievementCount > 0 && (
              <p className="text-font-secondary mt-0.5 text-xs">
                {game.achievementCount} badges · {game.totalExp.toLocaleString()}{" "}
                EXP
              </p>
            )}
          </div>
        </div>
        {game.achievementCount > 0 && <div
          className="absolute inset-x-3 bottom-15 flex items-center gap-1.5"
          aria-label={game.difficulties
            .map(
              ({ label, achievementCount }) =>
                `${achievementCount} ${label} badges`,
            )
            .join(", ")}
        >
          {game.difficulties.map(({ label, achievementCount }) => (
            <span
              key={label}
              className="group/difficulty relative flex h-3 w-3 items-center justify-center"
            >
              <span
                className={`h-2 w-2 rounded-full ${DIFFICULTY_COLORS[label]}`}
              />
              <span
                role="tooltip"
                className="bg-surface-overlay text-font-primary pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-44 -translate-x-1/2 rounded-md border border-border px-2 py-1 text-center text-[11px] opacity-0 shadow-black group-hover/difficulty:visible group-hover/difficulty:opacity-100"
              >
                {achievementCount} {label} badges
              </span>
            </span>
          ))}
        </div>}
      </Link>
      <div className="bg-surface-raised rounded-b-xl p-2">
        <button
          type="button"
          onClick={() => onToggleLibrary(game.id)}
          disabled={isPending}
          className={`focus-visible:ring-accent-cold flex w-full items-center justify-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors focus-visible:ring-2 disabled:cursor-wait disabled:opacity-60 ${isInLibrary ? "bg-brand-tertiary text-font-primary hover:bg-brand-primary" : "bg-brand-secondary text-font-primary hover:bg-brand-primary"}`}
        >
          {isInLibrary ? (
            <FiCheck className="h-4 w-4" />
          ) : (
            <FiPlus className="h-4 w-4" />
          )}
          {isPending
            ? "Updating..."
            : isInLibrary
              ? "In library"
              : "Add to library"}
        </button>
      </div>
    </article>
  );
}

export default Games;
