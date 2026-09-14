import { useEffect, useState } from "react";
import { FiAward, FiSearch, FiUser, FiX } from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { hollowthumb, userchomik } from "../../assets";
import { BADGE_DIFFICULTY_DETAILS } from "../../constants";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { mediaUrl } from "../../utils/media";

type SearchbarProps = {
  className?: string;
  inputClasses?: string;
  onSearch?: () => void;
};

function profileAvatarUrl(path: string | null) {
  return mediaUrl(path) || userchomik;
}

const Searchbar = ({
  className = "",
  inputClasses = "",
  onSearch,
}: SearchbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const { results, isLoading, hasError } = useGlobalSearch(query);
  const hasResults =
    results.users.length > 0 ||
    results.games.length > 0 ||
    results.badges.length > 0;
  const showResults = isSuggestionsOpen && query.trim().length >= 2;

  useEffect(() => {
    if (location.pathname !== "/search") return;
    const nextQuery = new URLSearchParams(location.search).get("q") || "";
    queueMicrotask(() => setQuery(nextQuery));
  }, [location.pathname, location.search]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setIsSuggestionsOpen(false);
    navigate(
      nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search",
    );
    onSearch?.();
  };

  const closeResults = () => {
    setQuery("");
    setIsSuggestionsOpen(false);
    onSearch?.();
  };

  const resultClassName =
    "text-font-secondary hover:bg-surface-soft hover:text-font-primary flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors";

  return (
    <div className={`relative min-w-0 ${className}`}>
      <form
        role="search"
        onSubmit={submitSearch}
        className="border-border bg-surface-soft/80 focus-within:border-accent-cold focus-within:bg-surface flex h-10 min-w-0 items-center rounded-xl border px-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors"
      >
        <FiSearch className="text-font-muted ml-2 h-4 w-4 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsSuggestionsOpen(true);
          }}
          onFocus={() => setIsSuggestionsOpen(true)}
          className={`text-font-primary placeholder:text-font-muted min-w-0 flex-1 appearance-none bg-transparent px-2 text-sm outline-none [&::-webkit-search-cancel-button]:appearance-none ${inputClasses}`}
          placeholder="Search…"
          aria-label="Search for games, users and badges"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsSuggestionsOpen(false);
            }}
            className="text-font-muted hover:text-font-primary grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors"
            aria-label="Clear search"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="bg-brand-secondary text-font-primary hover:bg-brand-primary grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors"
          aria-label="Search"
        >
          <FiSearch className="h-4 w-4" />
        </button>
      </form>
      {showResults && (
        <div className="border-border bg-surface absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[min(30rem,calc(100vh-5rem))] overflow-y-auto rounded-xl border p-1.5 shadow-black">
          {isLoading ? (
            <p className="text-font-muted px-3 py-4 text-sm">Searching…</p>
          ) : hasError ? (
            <p className="text-destructive px-3 py-4 text-sm">
              Search could not be completed.
            </p>
          ) : hasResults ? (
            <>
              <SearchGroup label="Players" icon={FiUser}>
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${encodeURIComponent(user.username)}`}
                    onClick={closeResults}
                    className={resultClassName}
                  >
                    <img
                      src={profileAvatarUrl(user.avatar_path)}
                      alt=""
                      className="border-border h-7 w-7 rounded-full border object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = userchomik;
                      }}
                    />
                    <span className="truncate">{user.username}</span>
                  </Link>
                ))}
              </SearchGroup>
              <SearchGroup label="Games" icon={FiSearch}>
                {results.games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    onClick={closeResults}
                    className={resultClassName}
                  >
                    <img
                      src={
                        mediaUrl(game.cover_path) || hollowthumb
                      }
                      alt=""
                      className="bg-surface-raised h-7 w-7 rounded-md object-cover object-center"
                    />
                    <span className="truncate">{game.name}</span>
                  </Link>
                ))}
              </SearchGroup>
              <SearchGroup label="Badges" icon={FiAward}>
                {results.badges.map((badge) => (
                  <Link
                    key={badge.id}
                    to={`/games/${badge.game_id}?badge=${badge.id}`}
                    onClick={closeResults}
                    className={resultClassName}
                  >
                    <img
                      src={
                        mediaUrl(badge.icon_path) || BADGE_DIFFICULTY_DETAILS[badge.difficulty].icon
                      }
                      alt=""
                      className="bg-surface-raised h-7 w-7 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{badge.name}</span>
                      <span className="text-font-muted block truncate text-xs">
                        {badge.game_name}
                      </span>
                    </span>
                  </Link>
                ))}
              </SearchGroup>
              <Link
                to={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={closeResults}
                className="text-accent-cold hover:text-hover block rounded-lg px-3 py-2 text-sm font-medium"
              >
                View all results
              </Link>
            </>
          ) : (
            <p className="text-font-muted px-3 py-4 text-sm">
              No matching players, games, or badges.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

function SearchGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof FiSearch;
  children: React.ReactNode;
}) {
  return (
    <section className="not-last:border-border not-last:mb-1 not-last:border-b not-last:pb-1">
      <p className="text-font-muted flex items-center gap-1.5 px-3 pt-2 pb-1 text-xs font-medium">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      {children}
    </section>
  );
}

export default Searchbar;
