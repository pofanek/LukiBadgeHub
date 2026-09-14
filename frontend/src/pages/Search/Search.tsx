import { Children } from "react";
import { FiAward, FiSearch, FiUser } from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import { hollowthumb, userchomik } from "../../assets";
import { FocusContent, LoadingIndicator } from "../../components";
import { BADGE_DIFFICULTY_DETAILS } from "../../constants";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { mediaUrl } from "../../utils/media";

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { results, isLoading, hasError } = useGlobalSearch(query, 20);
  const hasResults =
    results.users.length || results.games.length || results.badges.length;

  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-7 lg:px-10">
          <header className="border-border border-b pb-6">
            <p className="text-accent-cold text-sm font-medium">Search</p>
            <h1 className="text-font-primary mt-1 font-serif text-4xl sm:text-5xl">
              {query.trim() ? (
                <>Results for “{query.trim()}”</>
              ) : (
                "Find players, games, and badges"
              )}
            </h1>
            <p className="text-font-secondary mt-3 max-w-2xl leading-relaxed">
              Search across the whole Luki Badge Hub catalogue from the
              navigation bar.
            </p>
          </header>

          {!query.trim() ? (
            <EmptySearch />
          ) : query.trim().length < 2 ? (
            <p className="text-font-muted mt-8 text-sm">
              Enter at least two characters to search.
            </p>
          ) : isLoading ? (
            <div className="py-16">
              <LoadingIndicator label="Searching Luki Badge Hub..." />
            </div>
          ) : hasError ? (
            <p role="alert" className="text-destructive mt-8 text-sm">
              Search could not be completed. Please try again.
            </p>
          ) : !hasResults ? (
            <EmptySearch query={query.trim()} />
          ) : (
            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              <ResultSection
                icon={FiUser}
                title="Players"
                empty="No players found."
              >
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${encodeURIComponent(user.username)}`}
                    className="ResultLink"
                  >
                    <img
                      src={
                        mediaUrl(user.avatar_path) || userchomik
                      }
                      alt=""
                      className="border-border h-10 w-10 rounded-full border object-cover"
                    />
                    <span className="truncate">{user.username}</span>
                  </Link>
                ))}
              </ResultSection>
              <ResultSection
                icon={FiSearch}
                title="Games"
                empty="No games found."
              >
                {results.games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className="ResultLink"
                  >
                    <img
                      src={
                        mediaUrl(game.cover_path) || hollowthumb
                      }
                      alt=""
                      className="bg-surface-raised h-10 w-10 rounded-lg object-cover object-center"
                    />
                    <span className="truncate">{game.name}</span>
                  </Link>
                ))}
              </ResultSection>
              <ResultSection
                icon={FiAward}
                title="Badges"
                empty="No badges found."
              >
                {results.badges.map((badge) => (
                  <Link
                    key={badge.id}
                    to={`/games/${badge.game_id}?badge=${badge.id}`}
                    className="ResultLink"
                  >
                    <img
                      src={
                        mediaUrl(badge.icon_path) || BADGE_DIFFICULTY_DETAILS[badge.difficulty].icon
                      }
                      alt=""
                      className="bg-surface-raised h-10 w-10 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{badge.name}</span>
                      <span className="text-font-muted mt-0.5 block truncate text-xs">
                        {badge.game_name}
                      </span>
                    </span>
                  </Link>
                ))}
              </ResultSection>
            </div>
          )}
        </div>
      </section>
    </FocusContent>
  );
}

function ResultSection({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: typeof FiSearch;
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-3">
      <h2 className="text-font-primary flex items-center gap-2 px-2 py-2 font-serif text-2xl">
        <Icon className="text-accent-cold h-5 w-5" />
        {title}
      </h2>
      <div className="mt-1 space-y-1">
        {Children.count(children) ? (
          children
        ) : (
          <p className="text-font-muted px-2 py-4 text-sm">{empty}</p>
        )}
      </div>
    </section>
  );
}

function EmptySearch({ query }: { query?: string }) {
  return (
    <div className="border-border bg-surface/75 mt-7 rounded-xl border px-5 py-14 text-center">
      <FiSearch className="text-accent-cold mx-auto h-7 w-7" />
      <h2 className="text-font-primary mt-4 font-serif text-2xl">
        {query ? "Nothing matched that search" : "Start with a search"}
      </h2>
      <p className="text-font-secondary mx-auto mt-2 max-w-md text-sm leading-relaxed">
        {query
          ? "Try a different name or a shorter phrase."
          : "Use the search field above to look for players, games, or badges."}
      </p>
    </div>
  );
}

export default Search;
