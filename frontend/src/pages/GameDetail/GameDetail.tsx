import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiBookmark,
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiExternalLink,
  FiGrid,
  FiList,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import { FaSteam, FaStar, FaTrophy } from "react-icons/fa";
import { hollow, hollowthumb, userchomik } from "../../assets";
import {
  BADGE_DIFFICULTIES,
  BADGE_DIFFICULTY_DETAILS,
  getBadgeDifficultyLabel,
  getBadgeExperience,
  getBadgeTierLabel,
  type BadgeDifficultyId,
  type BadgeTier,
  type CatalogueGame,
} from "../../constants";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useGame } from "../../hooks/useGames";
import { supabase } from "../../utils/supabase";

const ACHIEVEMENTS_PER_PAGE = 9;

export type Difficulty = {
  id: BadgeDifficultyId;
  label: string;
  color: string;
  total: number;
  obtained: number;
  totalExp: number;
};

export type GameAchievement = {
  id: string;
  name: string;
  description: string;
  difficultyId: BadgeDifficultyId;
  tier?: BadgeTier;
  exp: number;
  iconUrl?: string;
  locked?: boolean;
  developerNote?: string;
};

export type RecentPlayer = {
  id: string;
  username: string;
  playedAt: string;
  avatarUrl?: string;
  obtained: number;
  total: number;
};

export type GameDetailData = {
  id: number;
  title: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  genres: string[];
  description: string;
  bannerUrl?: string;
  coverUrl?: string;
  steamUrl?: string;
  achievements: GameAchievement[];
  difficulties: Difficulty[];
  recentPlayers: RecentPlayer[];
};

const demoGame: GameDetailData = {
  id: 1,
  title: "Fall Guys",
  developer: "Mediatonic",
  publisher: "Devolver Digital",
  releaseDate: "Aug 04, 2020",
  genres: ["Indie", "Platform", "Racing"],
  bannerUrl: hollow,
  coverUrl: hollowthumb,
  description:
    "Fall Guys flings hordes of contestants together online in a mad dash through round after round of escalating chaos until one victor remains. Battle bizarre obstacles, shove through unruly competitors, and overcome the unbending laws of physics.",
  steamUrl: "https://store.steampowered.com/",
  difficulties: [
    {
      id: "easy",
      label: "Easy",
      color: "#46c85a",
      obtained: 14,
      total: 14,
      totalExp: 1_120,
    },
    {
      id: "medium",
      label: "Medium",
      color: "#3d8ef0",
      obtained: 8,
      total: 8,
      totalExp: 960,
    },
    {
      id: "hard",
      label: "Hard",
      color: "#C43A3A",
      obtained: 4,
      total: 4,
      totalExp: 800,
    },
    {
      id: "extreme",
      label: "Extreme",
      color: "#e84f81",
      obtained: 2,
      total: 2,
      totalExp: 600,
    },
    {
      id: "supreme",
      label: "Supreme",
      color: "#c5a7f4",
      obtained: 0,
      total: 0,
      totalExp: 0,
    },
    {
      id: "inhuman",
      label: "Inhuman",
      color: "#657080",
      obtained: 0,
      total: 0,
      totalExp: 0,
    },
  ],
  achievements: [
    {
      id: "welcome",
      name: "Welcome to the Show!",
      description: "Play your first show",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "trip",
      name: "One Small Trip",
      description: "Qualify from your first round",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "fall-bae",
      name: "Fall Bae",
      description:
        "Reach Round 3 in any showshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshowshow",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "squad",
      name: "Squad Goals",
      description:
        "Win a squad show but this description is really long so maybe stop beating it and listen to me okay? siema rotrix",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "stylish",
      name: "Stylish",
      description: "Equip a costume piece",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "shopping",
      name: "Shopping Spree",
      description: "Purchase an item from the store",
      difficultyId: "medium",
      exp: 120,
    },
    {
      id: "crown",
      name: "Crown Collector",
      description: "Win your first crown",
      difficultyId: "medium",
      exp: 120,
    },
    {
      id: "infallible",
      name: "Infallible",
      description: "Win 5 shows in a row",
      difficultyId: "hard",
      exp: 200,
    },
    {
      id: "final-fall",
      name: "Final Fall",
      description: "Win a final round without falling",
      difficultyId: "extreme",
      exp: 300,
    },
    {
      id: "low-baller",
      name: "Low Baller",
      description: "Qualify from a round without scoring points",
      difficultyId: "medium",
      exp: 120,
    },
    {
      id: "terminal-velocity",
      name: "Terminal Velocity",
      description: "Reach terminal velocity",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "big-tease",
      name: "Big Tease",
      description: "Equip a legendary costume",
      difficultyId: "medium",
      exp: 120,
    },
    {
      id: "track-star",
      name: "Track Star",
      description: "Win a race round",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "head-turner",
      name: "Head Turner",
      description: "Change your nickname",
      difficultyId: "easy",
      exp: 80,
    },
    {
      id: "big-air",
      name: "Big Air",
      description: "Spend 30 seconds in the air",
      difficultyId: "hard",
      exp: 200,
    },
    {
      id: "big-league",
      name: "Big League",
      description: "Reach level 40 in the season pass",
      difficultyId: "medium",
      exp: 120,
    },
    {
      id: "golden",
      name: "Golden",
      description: "Unlock a golden costume piece",
      difficultyId: "extreme",
      exp: 300,
    },
    {
      id: "five-star",
      name: "Five Star",
      description: "Earn five crowns in one season",
      difficultyId: "hard",
      exp: 200,
    },
    {
      id: "skyline-stumble",
      name: "Skyline Stumble",
      description: "Win every round in a single show",
      difficultyId: "supreme",
      exp: 500,
      developerNote:
        "To get this badge, you’re supposed to use a double pogo on an enemy’s bullet.",
    },
    {
      id: "perfect-path",
      name: "Perfect Path",
      description:
        "Complete a show without touching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacletouching an obstacle",
      difficultyId: "inhuman",
      exp: 800,
      developerNote:
        "This challenge rewards a flawless route through every obstacle.",
    },
  ],
  recentPlayers: [
    {
      id: "1",
      username: "player123",
      playedAt: "2d ago",
      obtained: 40,
      total: 40,
    },
    {
      id: "2",
      username: "AnimeLover",
      playedAt: "5d ago",
      obtained: 28,
      total: 40,
    },
    {
      id: "3",
      username: "Speedster",
      playedAt: "1w ago",
      obtained: 12,
      total: 40,
    },
    {
      id: "4",
      username: "Pofanek",
      playedAt: "1w ago",
      obtained: 8,
      total: 40,
    },
  ],
};

type TemplateProps = { game: GameDetailData };

function FeedbackToast({
  message,
  error,
  onDismiss,
}: {
  message: string;
  error: boolean;
  onDismiss: () => void;
}) {
  const Icon = error ? FiAlertCircle : FiCheckCircle;
  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
      role={error ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}
      >
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-destructive" : "text-accent-cold"}`}
        />
        <p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1"
          aria-label="Dismiss notification"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function GameDetailTemplate({ game }: TemplateProps) {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [badgeClaims, setBadgeClaims] = useState<
    { user_id: string; badge_id: number; earned_at: string }[]
  >([]);
  const [playerProfiles, setPlayerProfiles] = useState<
    Record<string, { username: string; avatar_path: string | null }>
  >({});
  const [claimError, setClaimError] = useState("");
  const [claimNotice, setClaimNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"achievements" | "comments">(
    "achievements",
  );
  const [query, setQuery] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    [],
  );
  const [status, setStatus] = useState<"all" | "obtained" | "not-obtained">(
    "all",
  );
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"difficulty" | "name">("difficulty");
  const [page, setPage] = useState(1);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isLibraryBusy, setIsLibraryBusy] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  useEffect(() => {
    const difficulty = searchParams.get("difficulty") as BadgeDifficultyId | null;
    setSelectedDifficulties(
      difficulty && BADGE_DIFFICULTIES.includes(difficulty) ? [difficulty] : [],
    );
  }, [searchParams]);
  useEffect(() => {
    if (!claimNotice && !claimError) return;
    const timer = window.setTimeout(() => {
      setClaimNotice("");
      setClaimError("");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [claimNotice, claimError]);
  const badgeIds = useMemo(
    () => game.achievements.map((achievement) => Number(achievement.id)),
    [game.achievements],
  );
  useEffect(() => {
    let active = true;
    if (!badgeIds.length) {
      queueMicrotask(() => {
        if (!active) return;
        setBadgeClaims([]);
        setPlayerProfiles({});
      });
      return () => {
        active = false;
      };
    }
    supabase
      .from("user_badges")
      .select("user_id, badge_id, earned_at")
      .in("badge_id", badgeIds)
      .then(async ({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setClaimError("Badge progress could not be loaded.");
          return;
        }
        const claims = (data || []) as {
          user_id: string;
          badge_id: number;
          earned_at: string;
        }[];
        setBadgeClaims(claims);
        const playerIds = [...new Set(claims.map((claim) => claim.user_id))];
        if (!playerIds.length) {
          setPlayerProfiles({});
          return;
        }
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, username, avatar_path")
          .in("id", playerIds);
        if (!active) return;
        setPlayerProfiles(
          Object.fromEntries(
            (profiles || []).map((profile) => [
              profile.id,
              { username: profile.username, avatar_path: profile.avatar_path },
            ]),
          ),
        );
      });
    return () => {
      active = false;
    };
  }, [badgeIds]);
  const earnedBadgeIds = useMemo(
    () =>
      new Set(
        badgeClaims
          .filter((claim) => claim.user_id === user?.id)
          .map((claim) => claim.badge_id),
      ),
    [badgeClaims, user?.id],
  );
  const progressGame = useMemo(() => {
    const achievements = game.achievements.map((achievement) => ({
      ...achievement,
      locked: !earnedBadgeIds.has(Number(achievement.id)),
    }));
    const difficulties = BADGE_DIFFICULTIES.map((difficulty) => {
      const badges = achievements.filter(
        (achievement) => achievement.difficultyId === difficulty,
      );
      return {
        id: difficulty,
        label: getBadgeDifficultyLabel(difficulty),
        color: BADGE_DIFFICULTY_DETAILS[difficulty].color,
        total: badges.length,
        obtained: badges.filter((badge) => !badge.locked).length,
        totalExp: badges.reduce((total, badge) => total + badge.exp, 0),
      };
    });
    const players = [...new Set(badgeClaims.map((claim) => claim.user_id))]
      .map((playerId) => {
        const claims = badgeClaims.filter((claim) => claim.user_id === playerId);
        const latest = claims.reduce(
          (current, claim) =>
            !current || claim.earned_at > current ? claim.earned_at : current,
          "",
        );
        const profile = playerProfiles[playerId];
        return {
          id: playerId,
          username: profile?.username || "Unknown player",
          playedAt: latest
            ? new Intl.DateTimeFormat(undefined, {
                day: "numeric",
                month: "short",
              }).format(new Date(latest))
            : "",
          avatarUrl: profile?.avatar_path
            ? supabase.storage
                .from("profile-media")
                .getPublicUrl(profile.avatar_path).data.publicUrl
            : undefined,
          obtained: claims.length,
          total: achievements.length,
        };
      })
      .sort((left, right) => right.obtained - left.obtained || left.username.localeCompare(right.username))
      .slice(0, 5);
    return { ...game, achievements, difficulties, recentPlayers: players };
  }, [badgeClaims, earnedBadgeIds, game, playerProfiles]);
  const displayedInLibrary = user ? isInLibrary : false;
  const totalExp = progressGame.difficulties.reduce(
    (sum, tier) => sum + tier.totalExp,
    0,
  );
  const obtained = progressGame.difficulties.reduce(
    (sum, tier) => sum + tier.obtained,
    0,
  );
  const achievementTotal = progressGame.difficulties.reduce(
    (sum, tier) => sum + tier.total,
    0,
  );
  const progressExp = progressGame.achievements
    .filter((achievement) => !achievement.locked)
    .reduce((sum, achievement) => sum + achievement.exp, 0);
  const difficultyById = new Map(
    progressGame.difficulties.map((difficulty) => [difficulty.id, difficulty]),
  );
  const visibleAchievements = useMemo(
    () => {
      const difficultyOrder = new Map(
        progressGame.difficulties.map((difficulty, index) => [
          difficulty.id,
          index,
        ]),
      );
      return progressGame.achievements
        .filter((achievement) => {
          const matchesQuery =
            achievement.name.toLowerCase().includes(query.toLowerCase()) ||
            achievement.description.toLowerCase().includes(query.toLowerCase());
          const matchesDifficulty =
            !selectedDifficulties.length ||
            selectedDifficulties.includes(achievement.difficultyId);
          const matchesStatus =
            status === "all" ||
            (status === "not-obtained"
              ? achievement.locked
              : !achievement.locked);
          return matchesQuery && matchesDifficulty && matchesStatus;
        })
        .sort((left, right) =>
          sort === "difficulty"
            ? difficultyOrder.get(left.difficultyId)! -
                difficultyOrder.get(right.difficultyId)! ||
              left.name.localeCompare(right.name)
            : left.name.localeCompare(right.name),
        );
    },
    [
      progressGame.achievements,
      progressGame.difficulties,
      query,
      selectedDifficulties,
      status,
      sort,
    ],
  );
  const pageCount = Math.max(
    1,
    Math.ceil(visibleAchievements.length / ACHIEVEMENTS_PER_PAGE),
  );
  const activePage = Math.min(page, pageCount);
  const pageAchievements = visibleAchievements.slice(
    (activePage - 1) * ACHIEVEMENTS_PER_PAGE,
    activePage * ACHIEVEMENTS_PER_PAGE,
  );
  const toggleDifficulty = (difficultyId: string) => {
    setPage(1);
    setSelectedDifficulties((current) =>
      current.includes(difficultyId)
        ? current.filter((id) => id !== difficultyId)
        : [...current, difficultyId],
    );
  };
  const resetFilters = () => {
    setQuery("");
    setSelectedDifficulties([]);
    setStatus("all");
    setSort("difficulty");
    setPage(1);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCurrent = true;
    supabase
      .from("user_game_library")
      .select("game_id")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .maybeSingle()
      .then(({ data }) => {
        if (isCurrent) setIsInLibrary(Boolean(data));
      });
    return () => {
      isCurrent = false;
    };
  }, [game.id, user]);

  const toggleProfileGame = async () => {
    setLibraryError("");
    if (!user) {
      window.sessionStorage.setItem(
        "luki-post-login-path",
        `${window.location.pathname}${window.location.search}`,
      );
      navigate("/login");
      return;
    }

    setIsLibraryBusy(true);
    const { error } = isInLibrary
      ? await supabase
          .from("user_game_library")
          .delete()
          .eq("user_id", user.id)
          .eq("game_id", game.id)
      : await supabase
          .from("user_game_library")
          .insert({ user_id: user.id, game_id: game.id });
    setIsLibraryBusy(false);
    if (error) {
      setLibraryError("The game library could not be updated. Please try again.");
      return;
    }
    setIsInLibrary(!isInLibrary);
  };

  const toggleBadgeClaim = async (badgeId: string, claimed: boolean) => {
    setClaimError("");
    setClaimNotice("");
    if (!user) {
      window.sessionStorage.setItem(
        "luki-post-login-path",
        `${window.location.pathname}${window.location.search}`,
      );
      navigate("/login");
      return;
    }
    const numericBadgeId = Number(badgeId);
    const { error: claimMutationError } = claimed
      ? await supabase
          .from("user_badges")
          .insert({ user_id: user.id, badge_id: numericBadgeId })
      : await supabase
          .from("user_badges")
          .delete()
          .eq("user_id", user.id)
          .eq("badge_id", numericBadgeId);
    if (claimMutationError) {
      setClaimError("Badge progress could not be updated. Please try again.");
      return;
    }
    setBadgeClaims((current) =>
      claimed
        ? [
            ...current,
            {
              user_id: user.id,
              badge_id: numericBadgeId,
              earned_at: new Date().toISOString(),
            },
          ]
        : current.filter(
            (claim) =>
              claim.user_id !== user.id || claim.badge_id !== numericBadgeId,
          ),
    );
    if (claimed) setIsInLibrary(true);
    setClaimNotice(claimed ? "Badge marked as completed." : "Badge progress updated.");
  };

  return (
    <section className="bg-primary w-full self-stretch pb-10">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-7">
        <GameHero
          game={progressGame}
          isInLibrary={displayedInLibrary}
          isLibraryBusy={isLibraryBusy}
          onAddToProfile={toggleProfileGame}
        />
        {libraryError && (
          <p role="alert" className="text-destructive mt-3 text-sm">
            {libraryError}
          </p>
        )}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-3">
              <Stat
                icon={FaTrophy}
                label="Badges"
                value={`${obtained} / ${achievementTotal}`}
              />
              <Stat
                icon={FaStar}
                label="Total EXP"
                value={totalExp.toLocaleString()}
              />
            </div>
            <section className="mt-6">
              <h2 className="text-font-primary font-serif text-xl">
                Badges by difficulty
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {progressGame.difficulties.map((difficulty) => (
                  <DifficultyCard
                    key={difficulty.id}
                    difficulty={difficulty}
                    selected={
                      !selectedDifficulties.length ||
                      selectedDifficulties.includes(difficulty.id)
                    }
                    onClick={() => toggleDifficulty(difficulty.id)}
                  />
                ))}
              </div>
            </section>
            <div className="border-border mt-5 flex border-b" role="tablist">
              <Tab
                active={activeTab === "achievements"}
                onClick={() => setActiveTab("achievements")}
              >
                Badges
              </Tab>
              <Tab
                active={activeTab === "comments"}
                onClick={() => setActiveTab("comments")}
              >
                Comments (0)
              </Tab>
            </div>
            {activeTab === "comments" ? (
              <Comments canComment={Boolean(user)} />
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
                <Filters
                  game={progressGame}
                  query={query}
                  setQuery={(value) => {
                    setPage(1);
                    setQuery(value);
                  }}
                  selected={selectedDifficulties}
                  toggle={toggleDifficulty}
                  status={status}
                  setStatus={(value) => {
                    setPage(1);
                    setStatus(value);
                  }}
                  sort={sort}
                  setSort={(value) => {
                    setPage(1);
                    setSort(value);
                  }}
                  reset={resetFilters}
                />
                <div className="min-w-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-font-primary font-serif text-xl">
                      Badges ({visibleAchievements.length})
                    </h2>
                    <div className="border-border bg-surface-soft flex rounded-lg border p-1">
                      <ViewButton
                        active={view === "grid"}
                        onClick={() => setView("grid")}
                        label="Grid view"
                      >
                        <FiGrid />
                      </ViewButton>
                      <ViewButton
                        active={view === "list"}
                        onClick={() => setView("list")}
                        label="List view"
                      >
                        <FiList />
                      </ViewButton>
                    </div>
                  </div>
                  <div
                    className={
                      view === "grid"
                        ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                        : "space-y-3"
                    }
                  >
                    {pageAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        difficulty={
                          difficultyById.get(achievement.difficultyId)!
                        }
                        list={view === "list"}
                        onClaimChange={toggleBadgeClaim}
                      />
                    ))}
                  </div>
                  {pageCount > 1 && (
                    <Pagination
                      page={activePage}
                      pageCount={pageCount}
                      onChange={setPage}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-3 xl:sticky xl:top-20 xl:h-fit">
            <GameInfo game={progressGame} />
            <Progress current={progressExp} total={totalExp} />
            {progressGame.recentPlayers.length > 0 && (
              <RecentPlayers players={progressGame.recentPlayers} />
            )}
          </aside>
        </div>
      </div>
      {(claimNotice || claimError) && (
        <FeedbackToast
          message={claimError || claimNotice}
          error={Boolean(claimError)}
          onDismiss={() => {
            setClaimNotice("");
            setClaimError("");
          }}
        />
      )}
    </section>
  );
}

function GameHero({
  game,
  isInLibrary,
  isLibraryBusy,
  onAddToProfile,
}: {
  game: GameDetailData;
  isInLibrary: boolean;
  isLibraryBusy: boolean;
  onAddToProfile: () => void;
}) {
  return (
    <header className="relative isolate [clip-path:inset(0_-100vw_0_-100vw)]">
      <div className="relative lg:min-h-[23rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 [mask-image:linear-gradient(to_bottom,#000_0%,#000_64%,transparent_100%)] bg-cover bg-center [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_64%,transparent_100%)]"
          style={
            game.bannerUrl
              ? { backgroundImage: `url(${game.bannerUrl})` }
              : undefined
          }
        />
        <div
          aria-hidden
          className="from-surface-soft/20 via-surface-overlay/45 to-primary pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 bg-linear-to-b via-[52%]"
        />
        <div className="grid gap-5 pt-6 pb-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:pt-10 sm:pb-8 lg:min-h-[23rem] lg:grid-cols-[10rem_minmax(0,1fr)_14rem] lg:content-end lg:gap-7 lg:pb-4">
          <Cover game={game} />
          <div className="min-w-0 self-center lg:self-start">
            <h1 className="text-font-primary font-serif text-4xl leading-none sm:text-5xl">
              {game.title}
            </h1>
            <p className="text-font-secondary mt-2">by {game.developer}</p>
            <p className="text-font-secondary mt-4 max-w-2xl text-sm leading-relaxed">
              {game.description}
            </p>
          </div>
          <div className="flex gap-2 self-center sm:col-span-2 sm:col-start-1 lg:col-span-1 lg:col-start-auto lg:flex-col lg:self-end">
            <button
              type="button"
              onClick={onAddToProfile}
              disabled={isLibraryBusy}
              className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium disabled:cursor-default disabled:opacity-70"
            >
              <FiBookmark />
              {isLibraryBusy
                ? "Updating..."
                : isInLibrary
                  ? "In Profile"
                  : "Add to Profile"}
            </button>
            {game.steamUrl && (
              <a
                href={game.steamUrl}
                target="_blank"
                rel="noreferrer"
                className="border-accent-cold/60 text-accent-cold hover:bg-effect-glass flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium"
              >
                <FaSteam />
                View on Steam
                <FiExternalLink />
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
function Cover({ game }: { game: GameDetailData }) {
  return (
    <div
      className="bg-surface-soft aspect-[3/4] w-32 overflow-hidden rounded-xl shadow-black sm:w-36 lg:w-40"
      style={
        game.coverUrl
          ? {
              backgroundImage: `url(${game.coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    />
  );
}
function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FaStar;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border bg-surface/75 flex min-w-36 items-center gap-3 rounded-xl border px-4 py-3">
      <Icon className="text-accent-cold h-6 w-6" />
      <div>
        <p className="text-font-primary font-semibold">{value}</p>
        <p className="text-font-muted text-xs">{label}</p>
      </div>
    </div>
  );
}
function DifficultyCard({
  difficulty,
  selected,
  onClick,
}: {
  difficulty: Difficulty;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-w-0 cursor-pointer rounded-xl border p-3 text-left transition-colors ${selected ? "bg-surface-soft/90" : "bg-surface-overlay/70 opacity-65 hover:opacity-90"}`}
      style={{
        borderColor: selected
          ? `${difficulty.color}a6`
          : `${difficulty.color}45`,
      }}
    >
      <p className="text-font-primary flex min-w-0 items-center gap-2 text-sm font-medium">
        <i
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: difficulty.color }}
        />
        <span className="truncate">{difficulty.label}</span>
      </p>
      <p className="text-font-primary mt-3 text-center font-serif text-xl">
        {difficulty.obtained} / {difficulty.total}
      </p>
      <p className="text-font-muted mt-1 text-center text-xs">
        <FaStar className="text-accent-cold mr-1 inline" />
        {difficulty.totalExp.toLocaleString()} EXP in this difficulty
      </p>
      <p
        className="mt-2 text-center text-xs"
        style={{ color: difficulty.color }}
      >
        {difficulty.total
          ? `${difficulty.total} badge${difficulty.total === 1 ? "" : "s"}`
          : "No badges"}
      </p>
    </button>
  );
}
function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-4 py-3 text-sm ${active ? "text-font-primary" : "text-font-muted hover:text-font-secondary"}`}
    >
      {children}
      {active && (
        <span className="bg-accent-cold absolute right-3 bottom-0 left-3 h-0.5" />
      )}
    </button>
  );
}
function Comments({ canComment }: { canComment: boolean }) {
  return (
    <section className="border-border bg-surface/75 mt-4 rounded-xl border p-4 sm:p-5">
      <h2 className="text-font-primary font-serif text-xl">Comments</h2>
      {canComment ? (
        <div className="mt-4">
          <label className="sr-only" htmlFor="game-comment">
            Add a comment
          </label>
          <textarea
            id="game-comment"
            rows={4}
            maxLength={500}
            placeholder="Share your thoughts about this game..."
            className="border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
            >
              <FiSend />
              Send comment
            </button>
          </div>
        </div>
      ) : (
        <p className="text-font-muted mt-3 text-sm">No comments yet.</p>
      )}
    </section>
  );
}
function Filters({
  game,
  query,
  setQuery,
  selected,
  toggle,
  status,
  setStatus,
  sort,
  setSort,
  reset,
}: {
  game: GameDetailData;
  query: string;
  setQuery: (value: string) => void;
  selected: string[];
  toggle: (id: string) => void;
  status: string;
  setStatus: (value: "all" | "obtained" | "not-obtained") => void;
  sort: "difficulty" | "name";
  setSort: (value: "difficulty" | "name") => void;
  reset: () => void;
}) {
  return (
    <aside className="border-border bg-surface/75 h-fit rounded-xl border px-3 pt-1.5 pb-3">
      <div className="flex items-center justify-between">
        <h2 className="text-font-primary font-medium">Filters</h2>
        <button
          type="button"
          onClick={reset}
          className="text-accent-cold text-xs hover:underline"
        >
          Reset
        </button>
      </div>
      <label className="border-border bg-surface-soft focus-within:border-accent-cold mt-3 flex items-center gap-2 rounded-lg border px-2.5">
        <FiSearch className="text-font-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="text-font-primary placeholder:text-font-muted min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          placeholder="Search badges..."
        />
      </label>
      <FilterGroup title="Difficulty">
        {game.difficulties.map((difficulty) => (
          <CheckRow
            key={difficulty.id}
            checked={selected.includes(difficulty.id)}
            onChange={() => toggle(difficulty.id)}
            label={`${difficulty.label} (${difficulty.total})`}
            color={difficulty.color}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Status">
        <CheckRow
          checked={status === "not-obtained"}
          onChange={() =>
            setStatus(status === "not-obtained" ? "all" : "not-obtained")
          }
          label={`Not obtained (${game.achievements.filter((item) => item.locked).length})`}
        />
        <CheckRow
          checked={status === "obtained"}
          onChange={() => setStatus(status === "obtained" ? "all" : "obtained")}
          label={`Obtained (${game.achievements.filter((item) => !item.locked).length})`}
        />
      </FilterGroup>
      <div className="text-font-primary mt-4 text-sm font-medium">
        Sort by
        <SortSelect value={sort} onChange={setSort} />
      </div>
    </aside>
  );
}
function SortSelect({
  value,
  onChange,
}: {
  value: "difficulty" | "name";
  onChange: (value: "difficulty" | "name") => void;
}) {
  const [open, setOpen] = useState(false);
  const options = [
    { value: "difficulty", label: "Difficulty" },
    { value: "name", label: "Name" },
  ] as const;
  const selected = options.find((option) => option.value === value)!;
  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="border-border bg-surface-soft text-font-secondary focus:border-accent-cold flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-sm outline-none"
      >
        <span>{selected.label}</span>
        <FiChevronDown
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="border-border bg-surface absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border shadow-black"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-2.5 py-2 text-left text-sm ${option.value === value ? "bg-brand-tertiary text-font-primary" : "text-font-secondary hover:bg-surface-soft hover:text-font-primary"}`}
            >
              <span>{option.label}</span>
              {option.value === value && <FiCheck className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-font-primary text-sm font-medium">{title}</legend>
      <div className="mt-2 space-y-2">{children}</div>
    </fieldset>
  );
}
function CheckRow({
  checked,
  onChange,
  label,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string;
}) {
  return (
    <label className="text-font-secondary hover:text-font-primary flex cursor-pointer items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`border-border bg-surface-soft peer-focus-visible:ring-accent-cold flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 ${checked ? "border-accent-cold bg-brand-tertiary text-font-primary" : "hover:border-font-muted"}`}
      >
        {checked && <FiCheck className="h-3 w-3" />}
      </span>
      {color && (
        <i
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{label}</span>
    </label>
  );
}
function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`rounded p-1.5 ${active ? "bg-brand-secondary text-font-primary" : "text-font-muted hover:text-font-primary"}`}
    >
      {children}
    </button>
  );
}
function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav
      className="mt-5 flex items-center justify-center gap-2"
      aria-label="Badge pages"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="border-border bg-surface-soft text-font-secondary hover:text-font-primary rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map(
        (pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm ${pageNumber === page ? "bg-brand-secondary text-font-primary" : "text-font-secondary hover:bg-effect-glass hover:text-font-primary"}`}
          >
            {pageNumber}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        className="border-border bg-surface-soft text-font-secondary hover:text-font-primary rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
function VerificationButton() {
  return (
    <button
      type="button"
      onClick={(event) => event.stopPropagation()}
      className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary focus-visible:outline-accent-cold mt-1.5 cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
    >
      Verify
    </button>
  );
}
function AchievementCard({
  achievement,
  difficulty,
  list,
  onClaimChange,
}: {
  achievement: GameAchievement;
  difficulty: Difficulty;
  list: boolean;
  onClaimChange: (badgeId: string, claimed: boolean) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const claimed = !achievement.locked;
  const canSelfClaim = ["easy", "medium", "hard"].includes(difficulty.id);
  const openDetails = () => setShowDetails(true);
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`View ${achievement.name} details`}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          openDetails();
        }
      }}
      className={`border-border bg-surface/75 relative rounded-xl border p-3 transition duration-200 ${list ? "hover:bg-surface-soft/75 flex cursor-pointer items-center gap-3 max-sm:flex-wrap" : "hover:border-accent-cold/70 hover:bg-surface-soft flex min-h-52 cursor-pointer flex-col hover:z-10 hover:scale-[1.025] max-sm:h-auto max-sm:min-h-44"}`}
    >
      <div
        className={`flex gap-3 ${list ? "min-w-0 flex-1 max-sm:basis-full" : ""}`}
      >
        <img
          src={achievement.iconUrl || BADGE_DIFFICULTY_DETAILS[difficulty.id].icon}
          alt=""
          className="bg-surface-raised h-16 w-16 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3
              title={achievement.name}
              className="text-font-primary truncate text-sm font-medium"
            >
              {achievement.name}
            </h3>
            {achievement.developerNote && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowNote(true);
                }}
                aria-haspopup="dialog"
                aria-label="Show additional note"
                className="border-border text-font-secondary hover:bg-surface-soft hover:text-font-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
              >
                ?
              </button>
            )}
          </div>
          <p
            title={achievement.description}
            className={`text-font-muted mt-1 text-xs leading-relaxed ${list ? "truncate" : "line-clamp-2 h-10"}`}
          >
            {achievement.description}
          </p>
        </div>
      </div>
      <div
        className={
          list
            ? "relative top-0.5 ml-auto shrink-0 max-sm:ml-0"
            : "mt-auto mb-3"
        }
      >
        {canSelfClaim ? (
          <label
            onClick={(event) => event.stopPropagation()}
            className="text-font-secondary hover:text-font-primary inline-flex cursor-pointer items-center gap-2 text-xs"
          >
            <input
              type="checkbox"
              checked={claimed}
              onChange={(event) =>
                onClaimChange(achievement.id, event.target.checked)
              }
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`border-border bg-surface-soft peer-focus-visible:ring-accent-cold flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 ${claimed ? "border-accent-cold bg-brand-tertiary text-font-primary" : "hover:border-font-muted"}`}
            >
              {claimed && <FiCheck className="h-3 w-3" />}
            </span>
            <span>Completed</span>
          </label>
        ) : (
          <div>
            <p className="text-font-muted text-xs">Manual verification required</p>
            <VerificationButton />
          </div>
        )}
      </div>
      {achievement.developerNote &&
        showNote &&
        createPortal(
          <div
            role="presentation"
            onClick={(event) => {
              event.stopPropagation();
              setShowNote(false);
            }}
            className="bg-surface-overlay/80 fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Additional note"
              onClick={(event) => event.stopPropagation()}
              className="border-border bg-surface-raised w-fit min-w-[18rem] max-w-[min(100%,56rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border p-5 shadow-black sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-font-primary font-serif text-2xl">
                  Additional note
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNote(false)}
                  aria-label="Close additional note"
                  className="text-font-muted hover:text-font-primary rounded p-1"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <p className="text-font-secondary mt-4 break-words text-base leading-relaxed">
                {achievement.developerNote}
              </p>
            </div>
          </div>,
          document.body,
        )}
      {showDetails && (
        <AchievementDetailsModal
          achievement={achievement}
          difficulty={difficulty}
          claimed={claimed}
          canSelfClaim={canSelfClaim}
          onClaimChange={(isClaimed) => onClaimChange(achievement.id, isClaimed)}
          onClose={() => setShowDetails(false)}
        />
      )}
      <div
        className={`flex items-center justify-between ${list ? "ml-3 shrink-0 justify-end gap-3 max-sm:ml-0" : "border-border border-t pt-3"}`}
      >
        <span className="text-xs" style={{ color: difficulty.color }}>
          <i
            className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: difficulty.color }}
          />
          {getBadgeTierLabel(achievement.tier || "low")} {difficulty.label}
        </span>
        <span className="text-font-muted text-xs">
          <FaStar className="text-accent-cold mr-1 inline" />
          {achievement.exp} EXP
        </span>
      </div>
    </article>
  );
}
function AchievementDetailsModal({
  achievement,
  difficulty,
  claimed,
  canSelfClaim,
  onClaimChange,
  onClose,
}: {
  achievement: GameAchievement;
  difficulty: Difficulty;
  claimed: boolean;
  canSelfClaim: boolean;
  onClaimChange: (claimed: boolean) => void;
  onClose: () => void;
}) {
  return createPortal(
    <div
      role="presentation"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      className="bg-surface-overlay/80 fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${achievement.name} details`}
        onClick={(event) => event.stopPropagation()}
        className="border-border bg-surface-raised max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl border p-5 shadow-black sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm" style={{ color: difficulty.color }}>
              <i
                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: difficulty.color }}
              />
              {difficulty.label}
            </p>
            <h3 className="text-font-primary mt-1 font-serif text-2xl">
              {achievement.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close badge details"
            className="text-font-muted hover:text-font-primary rounded p-1"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <p className="text-font-secondary mt-5 text-base leading-relaxed break-words">
          {achievement.description}
        </p>
        <div className="border-border mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {canSelfClaim ? (
            <label className="text-font-secondary hover:text-font-primary inline-flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={claimed}
                onChange={(event) => onClaimChange(event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`border-border bg-surface-soft peer-focus-visible:ring-accent-cold flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 ${claimed ? "border-accent-cold bg-brand-tertiary text-font-primary" : "hover:border-font-muted"}`}
              >
                {claimed && <FiCheck className="h-3 w-3" />}
              </span>
              <span>Completed</span>
            </label>
          ) : (
            <div>
              <p className="text-font-muted text-sm">Manual verification required</p>
              <VerificationButton />
            </div>
          )}
          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <span className="text-sm" style={{ color: difficulty.color }}>
              <i
                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: difficulty.color }}
              />
              {getBadgeTierLabel(achievement.tier || "low")} {difficulty.label}
            </span>
            <span className="text-font-secondary text-sm">
              <FaStar className="text-accent-cold mr-1 inline" />
              {achievement.exp} EXP
            </span>
          </div>
        </div>
        {achievement.developerNote && (
          <div className="border-border mt-5 border-t pt-4">
            <p className="text-font-primary text-sm font-medium">
              Additional note
            </p>
            <p className="text-font-secondary mt-1 text-sm leading-relaxed break-words">
              {achievement.developerNote}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
function GameInfo({ game }: { game: GameDetailData }) {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-3">
      <h2 className="text-font-primary font-serif text-lg">Game info</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Info label="Release Date" value={game.releaseDate} />
        <Info label="Developer" value={game.developer} />
        <Info label="Publisher" value={game.publisher} />
        <Info label="Genres" value={game.genres.join(", ")} />
      </dl>
      {game.steamUrl && (
        <div className="border-border mt-4 grid grid-cols-[6.5rem_1fr] items-center gap-2 border-t pt-3">
          <span className="text-font-muted text-xs">Links</span>
          <a
            href={game.steamUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-secondary text-font-primary flex w-fit items-center gap-2 rounded-md px-2.5 py-1.5 text-xs"
          >
            <FaSteam />
            Steam
            <FiExternalLink />
          </a>
        </div>
      )}
    </section>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <dt className="text-font-muted">{label}</dt>
      <dd className="text-font-secondary">{value}</dd>
    </div>
  );
}
function Progress({ current, total }: { current: number; total: number }) {
  const percentage = total ? Math.round((current / total) * 100) : 0;
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-3">
      <h2 className="text-font-primary font-serif text-lg">EXP Progress</h2>
      <p className="text-font-secondary mt-2 text-sm">
        {current.toLocaleString()} / {total.toLocaleString()} EXP ({percentage}
        %)
      </p>
      <div className="bg-surface-raised mt-2 h-2.5 overflow-hidden rounded-full">
        <div
          className="bg-accent-cold h-full rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}
function RecentPlayers({ players }: { players: RecentPlayer[] }) {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-font-primary font-serif text-lg">Top Players</h2>
        <button
          type="button"
          className="text-accent-cold text-xs hover:underline"
        >
          View All
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {players.map((player) => (
          <Link
            key={player.id}
            to={`/profile/${encodeURIComponent(player.username)}`}
            className="hover:bg-surface-raised focus-visible:ring-accent-cold grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md p-1 -m-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label={`View ${player.username}'s profile`}
          >
            <img
              src={player.avatarUrl || userchomik}
              alt=""
              className="bg-surface-raised h-7 w-7 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = userchomik;
              }}
            />
            <div className="min-w-0">
              <p className="text-font-secondary truncate text-xs">
                {player.username}
              </p>
              <p className="text-font-muted text-[11px]">{player.playedAt}</p>
              <div className="bg-surface-raised mt-1 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-accent-cold h-full rounded-full"
                  style={{
                    width: `${player.total ? (player.obtained / player.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-font-secondary text-xs">
              {player.obtained}/{player.total}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function toGameDetailData(game: CatalogueGame): GameDetailData {
  const releaseDate = game.releaseDate
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${game.releaseDate}T00:00:00`))
    : "Not set";

  return {
    id: game.id,
    title: game.title,
    developer: game.developer || "Not set",
    publisher: game.publisher || "Not set",
    releaseDate,
    genres: game.genres,
    description: game.description || "No description has been added yet.",
    bannerUrl: game.bannerUrl,
    coverUrl: game.cover,
    steamUrl: game.steamUrl || undefined,
    achievements: game.badges.map((badge) => ({
      id: String(badge.id),
      name: badge.name,
      description: badge.description,
      difficultyId: badge.difficulty,
      tier: badge.tier,
      exp: getBadgeExperience(badge.difficulty, badge.tier),
      iconUrl: badge.icon_path
        ? supabase.storage.from("game-media").getPublicUrl(badge.icon_path).data
            .publicUrl
        : BADGE_DIFFICULTY_DETAILS[badge.difficulty].icon,
      developerNote: badge.additional_note || undefined,
    })),
    difficulties: demoGame.difficulties.map((difficulty) => ({
      ...difficulty,
      total: game.badges.filter((badge) => badge.difficulty === difficulty.id)
        .length,
      obtained: 0,
      totalExp: game.badges
        .filter((badge) => badge.difficulty === difficulty.id)
        .reduce(
          (total, badge) =>
            total + getBadgeExperience(badge.difficulty, badge.tier),
          0,
        ),
    })),
    recentPlayers: [],
  };
}

export default function GameDetail() {
  const { id } = useParams();
  const gameId = Number(id);
  const { game, isLoading, error } = useGame(
    Number.isInteger(gameId) && gameId > 0 ? gameId : undefined,
  );

  if (isLoading)
    return (
      <section className="bg-primary w-full self-stretch py-20 text-center">
        <p className="text-font-secondary">Loading game...</p>
      </section>
    );

  if (!game)
    return (
      <section className="bg-primary w-full self-stretch py-20 text-center">
        <p className="text-font-secondary">{error || "This game could not be found."}</p>
      </section>
    );

  return (
    <GameDetailTemplate game={toGameDetailData(game)} />
  );
}
