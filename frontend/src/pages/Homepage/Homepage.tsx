import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FiArrowRight,
  FiAward,
  FiChevronDown,
  FiClock,
  FiEdit3,
  FiHeart,
  FiMonitor,
  FiLayers,
  FiTrendingUp,
  FiUserPlus,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import {
  CatalogueContributionCallout,
  FocusContent,
  LoadingIndicator,
} from "../../components";
import {
  getBadgeExperience,
  projectUpdates,
  type CatalogueGame,
} from "../../constants";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useGames } from "../../hooks/useGames";
import { type LeaderboardEntry, useLeaderboard } from "../../hooks/useLeaderboard";
import { useUserProfile } from "../../hooks/useUserProfile";
import { getLevelProgress } from "../../utils/leveling";
import { supabase } from "../../utils/supabase";
import { mediaUrl } from "../../utils/media";
import { getCachedQuery } from "../../utils/queryCache";

type LibraryEntry = { game_id: number; added_at: string };
type BadgeClaim = { badge_id: number; earned_at: string };
type Activity = { id: string; timestamp: string; icon: "library" | "badge" | "level"; content: ReactNode };

const updateDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

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
  ["Extreme", "Challenge to experienced players.", "bg-[#dd2e44]"],
  ["Supreme", "Requires extreme dedication.", "bg-[#aa8ed6]"],
  [
    "Inhuman",
    "only the best of the best can play it, it's above skill.",
    "bg-[#9CA3AF]",
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
  return mediaUrl(path);
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

function SupportProject() {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <FiHeart className="text-accent-cold h-5 w-5" />
            <h2 className="text-font-primary font-serif text-2xl">
              Support Luki Badge Hub
            </h2>
          </div>
          <p className="text-font-secondary mt-2 text-sm leading-relaxed">
            Help cover development and keep the project growing. Supporters receive
            a badge on their profile as a thank-you.
          </p>
        </div>
        <Link
          to="/support"
          className="border-border text-font-primary hover:bg-effect-glass inline-flex shrink-0 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
        >
          Support the project
        </Link>
      </div>
    </section>
  );
}

function LatestUpdate() {
  const updates = [...projectUpdates]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 3);

  if (!updates.length) return null;

  return (
    <details className="border-border bg-surface/75 group rounded-xl border">
      <summary className="hover:bg-surface-soft flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 transition-colors [&::-webkit-details-marker]:hidden sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <FiClock className="text-accent-cold h-5 w-5 shrink-0" />
          <p className="text-font-secondary min-w-0 truncate text-sm">
            <span className="text-font-primary font-medium">Latest update:</span>{" "}
            {updates[0].title}
          </p>
        </div>
        <FiChevronDown className="text-accent-cold h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-border border-t px-5 py-2 sm:px-6">
        <ul>
          {updates.map((update) => (
            <li
              key={`${update.date}-${update.title}`}
              className="border-border py-3 not-last:border-b"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <span className="text-accent-cold font-medium">{update.type}</span>
                <time className="text-font-muted" dateTime={update.date}>
                  {updateDateFormatter.format(new Date(`${update.date}T12:00:00`))}
                </time>
              </div>
              <p className="text-font-primary mt-1 text-sm font-medium">
                {update.title}
              </p>
              <p className="text-font-secondary mt-1 text-sm leading-relaxed">
                {update.summary}
              </p>
            </li>
          ))}
        </ul>
        <Link
          to="/updates"
          className="text-accent-cold hover:text-hover inline-flex items-center gap-1.5 py-3 text-sm font-medium"
        >
          View all updates
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </details>
  );
}

function Leaderboards({
  entries,
  isLoading,
}: {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}) {
  const leaders = entries.slice(0, 5);
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
      <Heading
        title="EXP Leaderboard"
        description="Players with the most EXP earned from completed badges."
        action={<ActionLink to="/leaderboard">View Leaderboards</ActionLink>}
      />
      {isLoading ? <div className="py-8"><LoadingIndicator label="Loading leaderboard..." /></div> : leaders.length ? (
        <ol className="divide-border divide-y">
          {leaders.map(({ profile_id, username, avatar_path, score }, index) => (
            <li
              key={profile_id}
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
                className="text-font-primary hover:text-hover min-w-0 flex-1 truncate"
              >
                {username}
              </Link>
              <span className="text-font-primary text-sm font-bold">
                {score.toLocaleString()} EXP
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
            Complete a badge challenge to enter the leaderboard.
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
  const [earnedBadgeClaims, setEarnedBadgeClaims] = useState<BadgeClaim[] | null>(null);
  const [featuredGameIds, setFeaturedGameIds] = useState<number[] | null>(null);
  const { entries: leaderboardEntries, position: leaderboardPosition, isLoading: isLeaderboardLoading } = useLeaderboard("experience", null, 1, user?.id);

  useEffect(() => {
    let current = true;
    if (!user) {
      queueMicrotask(() => {
        if (current) setLibraryEntries([]);
      });
    } else {
      queueMicrotask(() => {
        if (current) setLibraryEntries(null);
      });
      supabase
        .from("user_game_library")
        .select("game_id, added_at")
        .eq("user_id", user.id)
        .order("added_at", { ascending: false })
        .then(({ data }) => {
          if (current) setLibraryEntries(data || []);
        });
    }
    return () => {
      current = false;
    };
  }, [user]);

  useEffect(() => {
    let current = true;
    getCachedQuery(
      "homepage:featured-games",
      5 * 60_000,
      async () => {
        const { data, error } = await supabase
          .from("homepage_featured_games")
          .select("slot, game_id")
          .order("slot");
        if (error) throw error;
        return (data || []).map((entry) => entry.game_id);
      },
    ).then((gameIds) => {
      if (current) setFeaturedGameIds(gameIds);
    }).catch(() => {
      if (current) setFeaturedGameIds([]);
    });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    if (!user) {
      queueMicrotask(() => {
        if (current) setEarnedBadgeClaims([]);
      });
    } else {
      queueMicrotask(() => {
        if (current) setEarnedBadgeClaims(null);
      });
      supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (current) setEarnedBadgeClaims((data || []) as BadgeClaim[]);
        });
    }
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
    () => new Set((earnedBadgeClaims || []).map((claim) => claim.badge_id)),
    [earnedBadgeClaims],
  );
  const earnedBadges = useMemo(
    () =>
      catalogueGames.flatMap((game) =>
        game.badges.filter((badge) => earnedBadgeIdSet.has(badge.id)),
      ),
    [catalogueGames, earnedBadgeIdSet],
  );
  const earnedExp = useMemo(
    () =>
      earnedBadges.reduce(
        (total, badge) =>
          total + getBadgeExperience(badge.difficulty, badge.tier),
        0,
      ),
    [earnedBadges],
  );
  const currentRank = leaderboardPosition?.player_rank || null;
  const username = profile?.username || user?.email?.split("@")[0] || "player";
  const latestLibraryGame = libraryEntries?.[0]
    ? catalogueGames.find((game) => game.id === libraryEntries[0].game_id)
    : null;
  const featuredGames = useMemo(
    () =>
      featuredGameIds?.length === 5
        ? featuredGameIds
            .map((id) => catalogueGames.find((game) => game.id === id))
            .filter((game): game is CatalogueGame => Boolean(game))
        : catalogueGames.slice(0, 5),
    [catalogueGames, featuredGameIds],
  );
  const recentActivity = useMemo<Activity[]>(() => {
    const badgeById = new Map(catalogueGames.flatMap((game) => game.badges.map((badge) => [badge.id, { badge, game }] as const)));
    const activities: Activity[] = (libraryEntries || []).map((entry) => ({
      id: `library-${entry.game_id}-${entry.added_at}`,
      timestamp: entry.added_at,
      icon: "library",
      content: <>Added <span className="font-medium">{catalogueGames.find((game) => game.id === entry.game_id)?.title || "a game"}</span> to your library</>,
    }));
    let previousExp = 0;
    [...(earnedBadgeClaims || [])].sort((left, right) => left.earned_at.localeCompare(right.earned_at)).forEach((claim) => {
      const entry = badgeById.get(claim.badge_id);
      if (!entry) return;
      const nextExp = previousExp + getBadgeExperience(entry.badge.difficulty, entry.badge.tier);
      activities.push({ id: `badge-${claim.badge_id}-${claim.earned_at}`, timestamp: claim.earned_at, icon: "badge", content: <>Unlocked <span className="font-medium">{entry.badge.name}</span> in {entry.game.title}</> });
      const previousLevel = getLevelProgress(previousExp).level;
      const nextLevel = getLevelProgress(nextExp).level;
      for (let level = Math.ceil((previousLevel + 1) / 10) * 10; level <= nextLevel; level += 10) {
        activities.push({ id: `level-${level}-${claim.earned_at}`, timestamp: claim.earned_at, icon: "level", content: <>Reached <span className="font-medium">Level {level}</span></> });
      }
      previousExp = nextExp;
    });
    return activities.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }, [catalogueGames, earnedBadgeClaims, libraryEntries]);

  if (isAuthLoading || isGamesLoading)
    return (
      <FocusContent>
        <LoadingIndicator label="Loading home..." />
      </FocusContent>
    );

  const browseGames = (
    <section>
      <Heading
        title={user ? "Latest Releases" : "Browse Games"}
        description={
          user
            ? "Find a fresh badge path, a new genre, or the next high-value challenge."
            : "Browse a selection of games and see which badge paths suit you."
        }
        action={<ActionLink to="/games">Browse all games</ActionLink>}
      />
      <GameCards games={user ? catalogueGames.slice(0, 5) : featuredGames} />
    </section>
  );

  return (
    <FocusContent>
      <div
        className="w-full self-stretch bg-cover bg-fixed bg-center bg-no-repeat py-8 sm:py-10 lg:py-12"
        style={{
          backgroundImage: "url('/bg.png')",
        }}
      >
        <div className="mx-auto w-full max-w-6xl space-y-12 px-3 sm:px-7 lg:space-y-16">
          {user ? (
            <>
              <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
                <p className="text-accent-cold text-sm font-medium">
                  Luki Badge Hub
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-font-primary font-serif text-3xl sm:text-4xl">
                    Welcome back, {username}.
                  </h1>
                  {!profile?.hide_homepage_username_edit && <Link to="/settings?tab=profile" className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
                    <FiEdit3 className="h-4 w-4" /> Edit username
                  </Link>}
                </div>
                <p className="text-font-secondary mt-2 max-w-2xl leading-relaxed">
                  Keep building your library, take on new challenges, and make
                  every badge count.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [
                      "EXP earned",
                      earnedExp.toLocaleString(),
                      earnedBadges.length
                        ? "Earned from completed badges"
                        : "Complete badges to earn EXP",
                    ],
                    [
                      "Badges",
                      earnedBadges.length.toLocaleString(),
                      earnedBadges.length
                        ? "Completed badge challenges"
                        : "Start your first challenge",
                    ],
                    [
                      "Current rank",
                      currentRank ? `#${currentRank}` : "—",
                      "Current earned-EXP leaderboard position",
                    ],
                    [
                      "Games in library",
                      libraryGames.length.toString(),
                      latestLibraryGame
                        ? `Latest addition: ${latestLibraryGame.title}`
                        : "Add your first game",
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
                {libraryEntries === null || earnedBadgeClaims === null ? (
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
                  {recentActivity.length ? (
                    <ul className="divide-border divide-y">
                      {recentActivity
                        .slice(0, 4)
                        .map(({ id, timestamp, icon, content }) => {
                          const Icon = icon === "library" ? FiMonitor : icon === "badge" ? FiAward : FiTrendingUp;
                          return (
                            <li
                              key={id}
                              className="flex gap-3 py-3 first:pt-0 last:pb-0"
                            >
                              <Icon className="text-accent-cold mt-0.5 h-5 w-5 shrink-0" />
                              <div>
                                <p className="text-font-primary text-sm">{content}</p>
                                <p className="text-font-muted mt-1 text-xs">
                                  {new Intl.DateTimeFormat(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }).format(new Date(timestamp))}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p className="text-font-muted text-sm">
                      Add a game or unlock a badge to create your first activity entry.
                    </p>
                  )}
                </section>
                <DifficultyGuide />
              </section>
              {browseGames}
              <CatalogueContributionCallout />
              <Leaderboards
                entries={leaderboardEntries}
                isLoading={isLeaderboardLoading}
              />
              <LatestUpdate />
              <SupportProject />
            </>
          ) : (
            <>
              <ProjectIntro />
              <HowItWorks />
              {browseGames}
              <CatalogueContributionCallout />
              <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <DifficultyGuide />
                <Leaderboards
                  entries={leaderboardEntries}
                  isLoading={isLeaderboardLoading}
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
              <LatestUpdate />
              <SupportProject />
            </>
          )}
        </div>
      </div>
    </FocusContent>
  );
}

export default Homepage;
