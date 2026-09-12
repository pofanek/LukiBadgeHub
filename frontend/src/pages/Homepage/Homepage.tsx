import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FiArrowRight,
  FiAward,
  FiClock,
  FiMonitor,
  FiLayers,
  FiTrendingUp,
  FiUserPlus,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { FocusContent, LoadingIndicator } from "../../components";
import type { CatalogueGame } from "../../constants";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useGames } from "../../hooks/useGames";
import { useUserProfile } from "../../hooks/useUserProfile";
import { supabase } from "../../utils/supabase";

type LibraryEntry = { game_id: number; added_at: string };
type CommunityEntry = LibraryEntry & { user_id: string };
type CommunityProfile = {
  id: string;
  username: string;
  avatar_path: string | null;
};

const difficulties = [
  [
    "Easy",
    "A relaxed start for learning a game and its badges.",
    "bg-[#78b159]",
  ],
  [
    "Medium",
    "Needs consistency and a little game knowledge.",
    "bg-[#fdcb58]",
  ],
  ["Hard", "You have become good at the game.", "bg-[#f4900c]"],
  ["Extreme", "Challenge to experienced players", "bg-[#dd2e44]"],
  ["Supreme", "Requires extreme dedication .", "bg-[#aa8ed6]"],
  [
    "Inhuman",
    "only the best of the best can play it, it's above skill.",
    "bg-[#31373d]",
  ],
] as const;

function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-font-primary font-serif text-2xl sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="text-font-secondary mt-1 max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ActionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="text-accent-cold hover:text-hover inline-flex items-center gap-1.5 text-sm font-medium"
    >
      {children}
      <FiArrowRight className="h-4 w-4" />
    </Link>
  );
}

function GameCards({
  games,
  showProgress = false,
  earnedBadgeIds,
}: {
  games: CatalogueGame[];
  showProgress?: boolean;
  earnedBadgeIds?: Set<number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {games.map((game) => {
        const earnedBadgeCount = game.badges.filter((badge) =>
          earnedBadgeIds?.has(badge.id),
        ).length;

        return (
        <Link
          key={game.id}
          to={`/games/${game.id}`}
          className="group border-border bg-surface focus-visible:outline-accent-cold relative overflow-visible rounded-xl border shadow-black focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
            <img
              src={game.cover}
              alt=""
              style={{ objectPosition: game.coverPosition }}
              className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
            />
            <div className="from-surface-overlay via-surface-overlay/30 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-3 pt-12">
              <h3 className="text-font-primary truncate font-serif text-lg">
                {game.title}
              </h3>
              {game.achievementCount > 0 && <p className="text-font-secondary mt-0.5 text-xs">
                {game.totalExp.toLocaleString()} EXP
              </p>}
              {showProgress && game.achievementCount > 0 && (
                <>
                  <div className="bg-primary/75 mt-2 h-1.5 overflow-hidden rounded-full">
                    <span
                      className="bg-accent-cold block h-full"
                      style={{
                        width: `${game.achievementCount ? (earnedBadgeCount / game.achievementCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-font-muted mt-1 text-[11px]">
                    {earnedBadgeCount} of {game.achievementCount} badges obtained
                  </p>
                </>
              )}
            </div>
          </div>
          {game.achievementCount > 0 && (
            <div
              className={`absolute inset-x-3 flex items-center gap-1.5 ${showProgress ? "bottom-24" : "bottom-15"}`}
              aria-label={game.difficulties
                .map(
                  ({ label, achievementCount }) =>
                    `${achievementCount} ${label} badges`,
                )
                .join(", ")}
            >
              {game.difficulties
                .map(({ label, achievementCount }) => (
                  <span
                    key={label}
                    className="group/difficulty relative flex h-3 w-3 items-center justify-center"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${difficulties.find(([name]) => name === label)?.[2] || "bg-font-muted"}`}
                    />
                    <span
                      role="tooltip"
                      className="bg-surface-overlay text-font-primary pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-44 -translate-x-1/2 rounded-md border border-border px-2 py-1 text-center text-[11px] opacity-0 shadow-black group-hover/difficulty:visible group-hover/difficulty:opacity-100"
                    >
                      {achievementCount} {label} badges
                    </span>
                  </span>
                ))}
            </div>
          )}
        </Link>
        );
      })}
    </div>
  );
}

function avatarUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return supabase.storage.from("profile-media").getPublicUrl(path).data
    .publicUrl;
}

function DifficultyGuide() {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
      <Heading
        title="Find your challenge"
        description="Every badge belongs to a difficulty tier. Start where you are, then push further."
      />
      <div className="border-border divide-border divide-y border-l pl-4 sm:pl-5">
        {difficulties.map(([label, text, color]) => (
          <div key={label} className="relative py-3 first:pt-0 last:pb-0">
            <span
              className={`border-surface absolute top-5 -left-[1.35rem] h-3 w-3 rounded-full border-2 ${color}`}
            />
            <p className="text-font-primary font-medium">{label}</p>
            <p className="text-font-muted mt-0.5 text-sm">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectIntro({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`border-border bg-surface/75 rounded-xl border ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
    >
      <p className="text-accent-cold text-base font-semibold">Luki Badge Hub</p>
      <h1
        className={`text-font-primary mt-2 font-serif ${compact ? "text-2xl" : "text-3xl sm:text-4xl"}`}
      >
        Custom badges. Real challenges. Competition.
      </h1>
      <p className="text-font-secondary mt-4 max-w-2xl leading-relaxed">
        Luki Badge Hub is a multi-game badge hub. Add games, complete
        custom challenges, earn EXP, and measure your progress against other
        players.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/games"
          className="bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          Browse games
          <FiArrowRight className="h-4 w-4" />
        </Link>
        {!compact && (
          <Link
            to="/signup"
            className="border-border text-font-primary hover:bg-effect-glass rounded-lg border px-4 py-2.5 text-sm font-medium"
          >
            Create an account
          </Link>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    [
      FiMonitor,
      "Add games",
      "Build a library around the games you want to master.",
    ],
    [
      FiAward,
      "Earn badges",
      "Complete custom challenges across every difficulty.",
    ],
    [FiTrendingUp, "Gain EXP", "Turn every badge into visible progress."],
    [
      FiLayers,
      "Climb Leaderboards",
      "See how your progress compares with the community.",
    ],
  ] as const;
  return (
    <section>
      <Heading
        title="How it works"
        description="One hub for the games you play and the challenges you finish."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([Icon, title, text]) => (
          <article
            key={title}
            className="border-border bg-surface/75 rounded-xl border p-4"
          >
            <Icon className="text-accent-cold h-6 w-6" />
            <h3 className="text-font-primary mt-4 font-medium">{title}</h3>
            <p className="text-font-muted mt-1 text-sm leading-relaxed">
              {text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Leaderboards({
  profiles,
  potentialExp,
}: {
  profiles: CommunityProfile[];
  potentialExp: Map<string, number>;
}) {
  const leaders = useMemo(
    () =>
      profiles
        .map((profile) => ({
          ...profile,
          score: potentialExp.get(profile.id) || 0,
        }))
        .filter((profile) => profile.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [potentialExp, profiles],
  );
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
      <Heading
        title="EXP Leaderboard"
        description="Players with the most potential EXP gained across their games."
        action={<ActionLink to="/rankings">View Leaderboards</ActionLink>}
      />
      {leaders.length ? (
        <ol className="divide-border divide-y">
          {leaders.map(({ id, username, avatar_path, score }, index) => (
            <li
              key={id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-accent-cold w-5 text-sm font-medium">
                {index + 1}
              </span>
              {avatarUrl(avatar_path) ? (
                <img
                  src={avatarUrl(avatar_path) || undefined}
                  alt=""
                  className="border-border h-9 w-9 rounded-full border object-cover"
                />
              ) : (
                <span className="bg-brand-tertiary text-font-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium">
                  {username.slice(0, 1).toUpperCase()}
                </span>
              )}
              <Link
                to={`/profile/${encodeURIComponent(username)}`}
                className="text-font-primary hover:text-hover min-w-0 flex-1 truncate font-medium"
              >
                {username}
              </Link>
              <span className="text-font-secondary text-sm">
                {score.toLocaleString()} potential EXP
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="border-border bg-surface-soft/60 rounded-lg border px-4 py-8 text-center">
          <FiAward className="text-accent-cold mx-auto h-6 w-6" />
          <p className="text-font-primary mt-3 font-medium">
            The first challengers are arriving
          </p>
          <p className="text-font-muted mt-1 text-sm">
            Add games to your library to help shape the first leaderboard.
          </p>
        </div>
      )}
    </section>
  );
}

function Homepage() {
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const { games: catalogueGames, isLoading: isGamesLoading } = useGames();
  const { profile } = useUserProfile(user?.id);
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[] | null>(
    null,
  );
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<number[] | null>(null);
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [communityEntries, setCommunityEntries] = useState<CommunityEntry[]>(
    [],
  );

  useEffect(() => {
    let current = true;
    Promise.all([
      supabase
        .from("user_profiles")
        .select("id, username, avatar_path")
        .limit(50),
      supabase.from("user_game_library").select("user_id, game_id, added_at"),
    ]).then(([profilesResult, libraryResult]) => {
      if (!current) return;
      setProfiles(profilesResult.data || []);
      setCommunityEntries(libraryResult.data || []);
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setLibraryEntries([]);
      return;
    }
    let current = true;
    setLibraryEntries(null);
    supabase
      .from("user_game_library")
      .select("game_id, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false })
      .then(({ data }) => {
        if (current) setLibraryEntries(data || []);
      });
    return () => {
      current = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEarnedBadgeIds([]);
      return;
    }
    let current = true;
    setEarnedBadgeIds(null);
    supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (current) setEarnedBadgeIds((data || []).map((badge) => badge.badge_id));
      });
    return () => {
      current = false;
    };
  }, [user]);

  const libraryGames = useMemo(
    () =>
      (libraryEntries || [])
        .map(({ game_id }) =>
          catalogueGames.find((game) => game.id === game_id),
        )
        .filter((game): game is CatalogueGame => Boolean(game)),
    [catalogueGames, libraryEntries],
  );
  const earnedBadgeIdSet = useMemo(
    () => new Set(earnedBadgeIds || []),
    [earnedBadgeIds],
  );
  const potentialExp = useMemo(
    () => libraryGames.reduce((total, game) => total + game.totalExp, 0),
    [libraryGames],
  );
  const communityPotentialExp = useMemo(() => {
    const totals = new Map<string, number>();
    communityEntries.forEach(({ user_id, game_id }) => {
      const game = catalogueGames.find((item) => item.id === game_id);
      if (game) totals.set(user_id, (totals.get(user_id) || 0) + game.totalExp);
    });
    return totals;
  }, [catalogueGames, communityEntries]);
  const currentRank = useMemo(() => {
    if (!user || potentialExp === 0) return null;
    const rankedIds = [...communityPotentialExp.entries()]
      .sort(([, firstScore], [, secondScore]) => secondScore - firstScore)
      .map(([id]) => id);
    const rank = rankedIds.indexOf(user.id);
    return rank === -1 ? null : rank + 1;
  }, [communityPotentialExp, potentialExp, user]);
  const username = profile?.username || user?.email?.split("@")[0] || "player";

  if (isAuthLoading || isGamesLoading)
    return (
      <FocusContent>
        <LoadingIndicator label="Loading home..." />
      </FocusContent>
    );

  const browseGames = (
    <section>
      <Heading
        title={user ? "Browse games" : "Featured games"}
        description={
          user
            ? "Find a fresh badge path, a new genre, or the next high-value challenge."
            : "Browse a selection of games and see which badge paths suit you."
        }
        action={<ActionLink to="/games">Browse all games</ActionLink>}
      />
      <GameCards games={catalogueGames.slice(0, 5)} />
    </section>
  );

  return (
    <FocusContent>
      <div className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-6xl space-y-12 px-3 sm:px-7 lg:space-y-16">
          {user ? (
            <>
              <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
                <p className="text-accent-cold text-sm font-medium">
                  Luki Badge Hub
                </p>
                <h1 className="text-font-primary mt-2 font-serif text-3xl sm:text-4xl">
                  Welcome back, {username}.
                </h1>
                <p className="text-font-secondary mt-2 max-w-2xl leading-relaxed">
                  Keep building your library, take on new challenges, and make
                  every badge count.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["EXP earned", "0", "Badges are coming soon"],
                    ["Badges", "0", "Start your first challenge"],
                    [
                      "Current rank",
                      currentRank ? `#${currentRank}` : "—",
                      "Based on library potential EXP",
                    ],
                    [
                      "Games in library",
                      libraryGames.length.toString(),
                      `${potentialExp.toLocaleString()} potential EXP`,
                    ],
                  ].map(([label, value, detail]) => (
                    <div
                      key={label}
                      className="border-border bg-surface-soft/60 rounded-lg border p-4"
                    >
                      <p className="text-font-muted text-xs">{label}</p>
                      <p className="text-font-primary mt-2 font-serif text-3xl">
                        {value}
                      </p>
                      <p className="text-font-secondary mt-1 text-xs">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <Heading
                  title="Your games"
                  description="Pick up where you left off, or add a new challenge to your library."
                  action={<ActionLink to="/profile">View profile</ActionLink>}
                />
                {libraryEntries === null || earnedBadgeIds === null ? (
                  <div className="py-10">
                    <LoadingIndicator label="Loading your games..." />
                  </div>
                ) : libraryGames.length ? (
                  <GameCards
                    games={libraryGames.slice(0, 5)}
                    showProgress
                    earnedBadgeIds={earnedBadgeIdSet}
                  />
                ) : (
                  <div className="border-border bg-surface/75 rounded-xl border px-5 py-10 text-center">
                    <FiMonitor className="text-accent-cold mx-auto h-7 w-7" />
                    <h3 className="text-font-primary mt-3 font-serif text-2xl">
                      Your library is ready
                    </h3>
                    <p className="text-font-secondary mt-2 text-sm">
                      Add a game to start tracking your next badge path.
                    </p>
                    <Link
                      to="/games"
                      className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-5 inline-flex rounded-lg px-3 py-2 text-sm font-medium"
                    >
                      Browse games
                    </Link>
                  </div>
                )}
              </section>
              <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
                  <Heading
                    title="Recent activity"
                    description="The latest changes to your badge journey."
                  />
                  {libraryEntries?.length ? (
                    <ul className="divide-border divide-y">
                      {libraryEntries
                        .slice(0, 4)
                        .map(({ game_id, added_at }) => {
                          const game = catalogueGames.find(
                            (item) => item.id === game_id,
                          );
                          return game ? (
                            <li
                              key={`${game_id}-${added_at}`}
                              className="flex gap-3 py-3 first:pt-0 last:pb-0"
                            >
                              <FiClock className="text-accent-cold mt-0.5 h-5 w-5 shrink-0" />
                              <div>
                                <p className="text-font-primary text-sm">
                                  Added{" "}
                                  <span className="font-medium">
                                    {game.title}
                                  </span>{" "}
                                  to your library
                                </p>
                                <p className="text-font-muted mt-1 text-xs">
                                  {new Intl.DateTimeFormat(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }).format(new Date(added_at))}
                                </p>
                              </div>
                            </li>
                          ) : null;
                        })}
                    </ul>
                  ) : (
                    <p className="text-font-muted text-sm">
                      Add a game to create your first activity entry.
                    </p>
                  )}
                </section>
                <DifficultyGuide />
              </section>
              {browseGames}
              <Leaderboards
                profiles={profiles}
                potentialExp={communityPotentialExp}
              />
            </>
          ) : (
            <>
              <ProjectIntro />
              <HowItWorks />
              {browseGames}
              <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <DifficultyGuide />
                <Leaderboards
                  profiles={profiles}
                  potentialExp={communityPotentialExp}
                />
              </section>
              <section className="border-border bg-surface/75 rounded-xl border p-6 text-center sm:p-8">
                <FiUserPlus className="text-accent-cold mx-auto h-7 w-7" />
                <h2 className="text-font-primary mt-4 font-serif text-3xl">
                  Ready to start your journey?
                </h2>
                <p className="text-font-secondary mx-auto mt-2 max-w-xl leading-relaxed">
                  Create a profile, add your first game, and make your progress
                  visible.
                </p>
                <Link
                  to="/signup"
                  className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-5 inline-flex rounded-lg px-4 py-2.5 text-sm font-medium"
                >
                  Create an account
                </Link>
              </section>
            </>
          )}
        </div>
      </div>
    </FocusContent>
  );
}

export default Homepage;
