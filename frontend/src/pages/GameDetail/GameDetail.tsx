import { useCallback, useEffect, useMemo, useState } from "react";
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
  FiHeart,
  FiList,
  FiSearch,
  FiSend,
  FiX,
} from "react-icons/fi";
import { FaDiscord, FaHeart, FaSteam, FaStar, FaThumbtack, FaTrophy } from "react-icons/fa";
import { hollow, hollowthumb, userchomik } from "../../assets";
import {
  BADGE_DIFFICULTIES,
  BADGE_DIFFICULTY_DETAILS,
  BADGE_TIERS,
  DISCORD_URL,
  getBadgeDifficultyLabel,
  getBadgeExperience,
  getBadgeTierLabel,
  type BadgeDifficultyId,
  type BadgeTier,
  type CatalogueGame,
} from "../../constants";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useGame } from "../../hooks/useGames";
import { invalidateLeaderboardCache } from "../../hooks/useLeaderboard";
import { usePinnedBadge } from "../../hooks/usePinnedBadge";
import { useUserProfile } from "../../hooks/useUserProfile";
import { supabase } from "../../utils/supabase";
import { mediaUrl } from "../../utils/media";
import { invalidateCachedQueries } from "../../utils/queryCache";

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
  displayOrder?: number;
};

export type RecentPlayer = {
  id: string;
  username: string;
  playedAt: string;
  avatarUrl?: string;
  obtained: number;
  total: number;
  experience: number;
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
      experience: 3680,
    },
    {
      id: "2",
      username: "AnimeLover",
      playedAt: "5d ago",
      obtained: 28,
      total: 40,
      experience: 2640,
    },
    {
      id: "3",
      username: "Speedster",
      playedAt: "1w ago",
      obtained: 12,
      total: 40,
      experience: 1120,
    },
    {
      id: "4",
      username: "Pofanek",
      playedAt: "1w ago",
      obtained: 8,
      total: 40,
      experience: 760,
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
  const { profile } = useUserProfile(user?.id);
  const [commentCount, setCommentCount] = useState(0);
  const [badgeCreators, setBadgeCreators] = useState<{ id: string; username: string; avatar_path: string | null }[]>([]);
  const { pinnedBadgeId, setPinnedBadge, isSaving: isPinSaving } =
    usePinnedBadge(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedBadgeId = searchParams.get("badge");
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
    queueMicrotask(() => {
      setSelectedDifficulties(
        difficulty && BADGE_DIFFICULTIES.includes(difficulty) ? [difficulty] : [],
      );
    });
  }, [searchParams]);
  useEffect(() => {
    let active = true;
    supabase.from("game_badge_creators").select("profile_id").eq("game_id", game.id).then(async ({ data, error }) => {
      if (!active || error || !data?.length) { if (active) setBadgeCreators([]); return; }
      const { data: profiles } = await supabase.from("user_profiles").select("id, username, avatar_path").in("id", data.map((creator) => creator.profile_id));
      if (active) setBadgeCreators((profiles || []) as { id: string; username: string; avatar_path: string | null }[]);
    });
    return () => { active = false; };
  }, [game.id]);
  useEffect(() => {
    let active = true;
    supabase.from("game_comments").select("id", { count: "exact", head: true }).eq("game_id", game.id).then(({ count }) => {
      if (active) setCommentCount(count || 0);
    });
    return () => { active = false; };
  }, [game.id]);
  useEffect(() => {
    if (!claimNotice && !claimError) return;
    const timer = window.setTimeout(() => {
      setClaimNotice("");
      setClaimError("");
    }, 5000);
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
          avatarUrl: mediaUrl(profile?.avatar_path) || undefined,
          obtained: claims.length,
          total: achievements.length,
          experience: claims.reduce(
            (total, claim) =>
              total +
              (achievements.find((achievement) => Number(achievement.id) === claim.badge_id)?.exp || 0),
            0,
          ),
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
            ? BADGE_DIFFICULTIES.indexOf(left.difficultyId) - BADGE_DIFFICULTIES.indexOf(right.difficultyId) ||
              BADGE_TIERS.indexOf(left.tier || "low") - BADGE_TIERS.indexOf(right.tier || "low") ||
              (left.displayOrder || 0) - (right.displayOrder || 0)
            : left.name.localeCompare(right.name),
        );
    },
    [
      progressGame.achievements,
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
  useEffect(() => {
    if (!focusedBadgeId) return;
    const focusedIndex = visibleAchievements.findIndex(
      (achievement) => achievement.id === focusedBadgeId,
    );
    if (focusedIndex === -1) return;
    const focusedPage = Math.floor(focusedIndex / ACHIEVEMENTS_PER_PAGE) + 1;
    if (page !== focusedPage) queueMicrotask(() => setPage(focusedPage));
  }, [focusedBadgeId, page, visibleAchievements]);
  useEffect(() => {
    if (!focusedBadgeId || !pageAchievements.some((achievement) => achievement.id === focusedBadgeId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`badge-${focusedBadgeId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusedBadgeId, pageAchievements]);
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
    invalidateLeaderboardCache();
    invalidateCachedQueries(`game-players:${game.id}:`);
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
                    disabled={difficulty.total === 0}
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
                Comments ({commentCount})
              </Tab>
            </div>
            {activeTab === "comments" ? (
              <Comments gameId={game.id} userId={user?.id} role={profile?.role} onCountChange={setCommentCount} />
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
                        ? "grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-3"
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
                      pinnedBadgeId={pinnedBadgeId}
                      isPinSaving={isPinSaving}
                      onPinChange={(badgeId, pinned) =>
                        void setPinnedBadge(pinned ? badgeId : null).catch(() =>
                          setClaimError("Pinned badge could not be updated. Please try again."),
                        )
                      }
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
            <GameInfo game={progressGame} badgeCreators={badgeCreators} />
            <Progress current={progressExp} total={totalExp} />
            <BadgeProgress current={obtained} total={achievementTotal} />
            {progressGame.recentPlayers.length > 0 && (
              <RecentPlayers gameId={progressGame.id} players={progressGame.recentPlayers} />
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
  disabled,
  selected,
  onClick,
}: {
  difficulty: Difficulty;
  disabled: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={!disabled && selected}
      onClick={onClick}
      className={`min-w-0 rounded-xl border p-3 text-left transition-colors ${selected && !disabled ? "cursor-pointer bg-surface-soft/90" : "bg-surface-overlay/70 opacity-65"} ${disabled ? "cursor-not-allowed" : "hover:opacity-90"}`}
      style={{
        borderColor: selected && !disabled
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
type GameComment = { id: number; author_id: string; body: string; is_pinned: boolean; created_at: string };
function Comments({ gameId, userId, role, onCountChange }: { gameId: number; userId?: string; role?: string; onCountChange: (count: number) => void }) {
  const [comments, setComments] = useState<GameComment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { username: string; avatar_path: string | null }>>({});
  const [likes, setLikes] = useState<{ comment_id: number; profile_id: string }[]>([]);
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canComment = role === "Supporter" || role === "Moderator" || role === "Admin" || role === "Owner";
  const canPin = role === "Owner";
  const loadComments = useCallback(async () => {
    const { data, error } = await supabase.from("game_comments").select("id, author_id, body, is_pinned, created_at").eq("game_id", gameId);
    if (error) return;
    const next = (data || []) as GameComment[];
    setComments(next);
    onCountChange(next.length);
    const authorIds = [...new Set(next.map((comment) => comment.author_id))];
    const commentIds = next.map((comment) => comment.id);
    const [profileResult, likesResult] = await Promise.all([authorIds.length ? supabase.from("user_profiles").select("id, username, avatar_path").in("id", authorIds) : Promise.resolve({ data: [] as { id: string; username: string; avatar_path: string | null }[] }), commentIds.length ? supabase.from("game_comment_likes").select("comment_id, profile_id").in("comment_id", commentIds) : Promise.resolve({ data: [] as { comment_id: number; profile_id: string }[] })]);
    setProfiles(Object.fromEntries((profileResult.data || []).map((profile) => [profile.id, { username: profile.username, avatar_path: profile.avatar_path }])));
    setLikes((likesResult.data || []) as { comment_id: number; profile_id: string }[]);
  }, [gameId, onCountChange]);
  useEffect(() => { queueMicrotask(() => { void loadComments(); }); }, [loadComments]);
  const sendComment = async () => {
    if (!userId || !body.trim()) return;
    setIsSaving(true);
    const { error } = await supabase.from("game_comments").insert({ game_id: gameId, author_id: userId, body: body.trim() });
    setIsSaving(false);
    if (!error) { setBody(""); void loadComments(); }
  };
  const toggleLike = async (commentId: number) => {
    if (!userId) return;
    const liked = likes.some((like) => like.comment_id === commentId && like.profile_id === userId);
    const { error } = liked ? await supabase.from("game_comment_likes").delete().eq("comment_id", commentId).eq("profile_id", userId) : await supabase.from("game_comment_likes").insert({ comment_id: commentId, profile_id: userId });
    if (!error) void loadComments();
  };
  const pinComment = async (comment: GameComment) => {
    if (!canPin) return;
    if (!comment.is_pinned) await supabase.from("game_comments").update({ is_pinned: false }).eq("game_id", gameId).eq("is_pinned", true);
    const { error } = await supabase.from("game_comments").update({ is_pinned: !comment.is_pinned }).eq("id", comment.id);
    if (!error) void loadComments();
  };
  const displayed = [...comments].sort((left, right) => Number(right.is_pinned) - Number(left.is_pinned) || likes.filter((like) => like.comment_id === right.id).length - likes.filter((like) => like.comment_id === left.id).length || right.created_at.localeCompare(left.created_at));
  return <section className="border-border bg-surface/75 mt-4 rounded-xl border p-4 sm:p-5"><h2 className="text-font-primary font-serif text-xl">Comments</h2>{canComment ? <div className="mt-4"><label className="sr-only" htmlFor="game-comment">Add a comment</label><textarea id="game-comment" rows={4} maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share your thoughts about this game..." className="border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none" /><div className="mt-3 flex items-center justify-between gap-3"><span className="text-font-muted text-xs">{body.length}/2000</span><button type="button" onClick={() => void sendComment()} disabled={!body.trim() || isSaving} className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"><FiSend />{isSaving ? "Sending..." : "Send comment"}</button></div></div> : <p className="text-font-muted mt-3 text-sm">Comments are available for <Link to="/support" className="text-accent-cold hover:text-hover underline">Supporters</Link>, Moderators, and Admins only.</p>}{displayed.length ? <ol className="divide-border mt-5 divide-y">{displayed.map((comment) => { const count = likes.filter((like) => like.comment_id === comment.id).length; const liked = Boolean(userId && likes.some((like) => like.comment_id === comment.id && like.profile_id === userId)); const author = profiles[comment.author_id]; const profilePath = author ? `/profile/${encodeURIComponent(author.username)}` : "#"; return <li key={comment.id} className="py-4 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><Link to={profilePath} className="text-font-primary hover:text-hover flex items-center gap-2 text-sm font-medium"><img src={mediaUrl(author?.avatar_path) || userchomik} alt="" className="bg-surface-raised h-7 w-7 rounded-full object-cover" />{author?.username || "Unknown player"}</Link>{comment.is_pinned && <span className="text-accent-cold mr-auto text-xs">Pinned</span>}{canPin && <button type="button" onClick={() => void pinComment(comment)} className="text-font-muted hover:text-font-primary text-xs">{comment.is_pinned ? "Unpin" : "Pin"}</button>}</div><p className="text-font-secondary mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed"><LinkifiedText value={comment.body} /></p><div className="mt-3"><button type="button" onClick={() => void toggleLike(comment.id)} disabled={!userId} className={`inline-flex items-center gap-1.5 text-xs disabled:opacity-50 ${liked ? "text-accent-cold" : "text-font-muted hover:text-font-primary"}`}>{liked ? <FaHeart className="fill-current" /> : <FiHeart />}{count} {count === 1 ? "like" : "likes"}</button></div></li>; })}</ol> : <p className="text-font-muted mt-5 text-sm">No comments yet.</p>}</section>;
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
        className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary focus-visible:outline-accent-cold mt-1.5 cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
      >
        Verify
      </button>
      {isOpen && <VerificationDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
function VerificationDialog({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="bg-surface-overlay/80 fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="border-border bg-surface-raised max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border p-5 shadow-black sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-accent-cold text-sm font-medium">Badge verification</p>
            <h2 id="verification-dialog-title" className="text-font-primary mt-1 font-serif text-2xl">
              Verify your completion
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification instructions"
            className="text-font-muted hover:text-font-primary rounded p-1"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <p className="text-font-secondary mt-4 text-sm leading-relaxed">
          It&apos;s easy: join our Discord server, open the tickets channel, create a ticket, and send your proof.
        </p>
        <div className="border-border bg-surface-soft mt-5 rounded-xl border p-4">
          <p className="text-font-primary text-sm font-medium">What to send</p>
          <ul className="text-font-secondary mt-3 space-y-3 text-sm leading-relaxed">
            <li className="flex gap-2">
              <FiCheck className="text-accent-cold mt-0.5 h-4 w-4 shrink-0" />
              <span><strong className="text-font-primary font-medium">Extreme:</strong> a recording showing your Luki Badge Hub username and the completed challenge. You can upload the recording file directly to the ticket.</span>
            </li>
            <li className="flex gap-2">
              <FiCheck className="text-accent-cold mt-0.5 h-4 w-4 shrink-0" />
              <span><strong className="text-font-primary font-medium">Supreme and Inhuman:</strong> a complete, unedited recording of the entire run. A YouTube link is recommended.</span>
            </li>
          </ul>
        </div>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="bg-brand-secondary text-font-primary hover:bg-brand-primary focus-visible:outline-accent-cold mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <FaDiscord className="h-4 w-4" />
          Join Discord and create a ticket
          <FiExternalLink className="h-4 w-4" />
        </a>
      </section>
    </div>,
    document.body,
  );
}
function AchievementCard({
  achievement,
  difficulty,
  list,
  onClaimChange,
  pinnedBadgeId,
  isPinSaving,
  onPinChange,
}: {
  achievement: GameAchievement;
  difficulty: Difficulty;
  list: boolean;
  onClaimChange: (badgeId: string, claimed: boolean) => void;
  pinnedBadgeId: number | null;
  isPinSaving: boolean;
  onPinChange: (badgeId: number, pinned: boolean) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const claimed = !achievement.locked;
  const canSelfClaim = ["easy", "medium", "hard"].includes(difficulty.id);
  const openDetails = () => setShowDetails(true);
  return (
    <article
      id={`badge-${achievement.id}`}
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
      className={`border-border bg-surface/75 relative min-w-0 rounded-xl border p-3 transition duration-200 ${list ? "hover:bg-surface-soft/75 flex cursor-pointer items-center gap-3 max-sm:flex-wrap" : "hover:border-accent-cold/70 hover:bg-surface-soft flex min-h-52 cursor-pointer flex-col hover:z-10 hover:scale-[1.025] max-sm:h-auto max-sm:min-h-44"}`}
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
            className={`text-font-muted mt-1 whitespace-pre-wrap text-xs leading-relaxed ${list ? "truncate" : "line-clamp-2 h-10"}`}
          >
            <LinkifiedText value={achievement.description} />
          </p>
        </div>
      </div>
      <div
        className={
          list
            ? "relative top-0.5 ml-auto shrink-0 max-sm:ml-0"
            : "mt-auto py-1"
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
        ) : claimed ? (
          <span className="text-font-secondary inline-flex items-center gap-2 text-xs">
            <span className="border-accent-cold bg-brand-tertiary text-font-primary flex h-5 w-5 shrink-0 items-center justify-center rounded border">
              <FiCheck className="h-3 w-3" />
            </span>
            <span>Completed</span>
          </span>
        ) : (
          <VerificationButton />
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
                <LinkifiedText value={achievement.developerNote} />
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
          isPinned={pinnedBadgeId === Number(achievement.id)}
          isPinSaving={isPinSaving}
          onPinChange={(pinned) => onPinChange(Number(achievement.id), pinned)}
          onClose={() => setShowDetails(false)}
        />
      )}
      <div
        className={`flex items-center justify-between ${list ? "ml-3 shrink-0 justify-end gap-3 max-sm:ml-0" : "border-border min-h-12 border-t pt-3"}`}
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
  isPinned,
  isPinSaving,
  onPinChange,
  onClose,
}: {
  achievement: GameAchievement;
  difficulty: Difficulty;
  claimed: boolean;
  canSelfClaim: boolean;
  onClaimChange: (claimed: boolean) => void;
  isPinned: boolean;
  isPinSaving: boolean;
  onPinChange: (pinned: boolean) => void;
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
        <p className="text-font-secondary mt-5 whitespace-pre-wrap text-base leading-relaxed break-words">
          <LinkifiedText value={achievement.description} />
        </p>
        {claimed && (
          <button
            type="button"
            disabled={isPinSaving}
            onClick={() => onPinChange(!isPinned)}
            className="border-border text-font-secondary hover:bg-effect-glass hover:text-font-primary mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <FaThumbtack className="h-3.5 w-3.5" />
            {isPinned ? "Unpin from profile" : "Pin to profile"}
          </button>
        )}
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
          ) : claimed ? (
            <span className="text-font-secondary inline-flex items-center gap-2 text-sm">
              <span className="border-accent-cold bg-brand-tertiary text-font-primary flex h-4 w-4 shrink-0 items-center justify-center rounded border">
                <FiCheck className="h-3 w-3" />
              </span>
              <span>Completed</span>
            </span>
          ) : (
            <VerificationButton />
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
        {achievement.developerNote && <details className="border-border mt-5 border-t pt-4"><summary className="text-font-primary cursor-pointer text-sm font-bold">Additional note</summary><p className="text-font-secondary mt-3 whitespace-pre-wrap text-sm leading-relaxed break-words"><LinkifiedText value={achievement.developerNote} /></p></details>}
      </div>
    </div>,
    document.body,
  );
}
function LinkifiedText({ value }: { value: string }) {
  return <>{value.split(/(https?:\/\/[^\s]+)/g).map((part, index) => /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="text-accent-cold hover:text-hover underline break-all">{part}</a> : part)}</>;
}

function GameInfo({ game, badgeCreators }: { game: GameDetailData; badgeCreators: { id: string; username: string; avatar_path: string | null }[] }) {
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
      {badgeCreators.length > 0 && <div className="border-border mt-4 border-t pt-3"><p className="text-font-muted text-xs">Badge creators</p><div className="mt-3 space-y-3">{badgeCreators.map((creator) => <Link key={creator.id} to={`/profile/${encodeURIComponent(creator.username)}`} className="hover:bg-surface-raised focus-visible:ring-accent-cold grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-md p-1.5 -m-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"><img src={mediaUrl(creator.avatar_path) || userchomik} alt="" className="bg-surface-raised h-10 w-10 rounded-full object-cover" /><p className="text-font-primary truncate text-sm font-medium">{creator.username}</p></Link>)}</div></div>}
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
function BadgeProgress({ current, total }: { current: number; total: number }) {
  const percentage = total ? Math.round((current / total) * 100) : 0;
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-3">
      <h2 className="text-font-primary font-serif text-lg">Badge Progress</h2>
      <p className="text-font-secondary mt-2 text-sm">
        {current.toLocaleString()} / {total.toLocaleString()} BADGES ({percentage}
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
function RecentPlayers({ gameId, players }: { gameId: number; players: RecentPlayer[] }) {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-font-primary font-serif text-lg">Top Players</h2>
        <Link to={`/games/${gameId}/players`} className="text-accent-cold text-xs hover:underline">
          View All
        </Link>
      </div>
      <div className="text-font-muted mt-3 grid grid-cols-[1fr_auto] gap-3 border-b border-border pb-2 text-[10px] uppercase"><span>Player</span><span>Badges collected</span></div>
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
              <div className="bg-primary/75 mt-1 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-accent-cold h-full rounded-full"
                  style={{
                    width: `${player.total ? (player.obtained / player.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-font-secondary text-xs">{player.obtained}/{player.total}</span>
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
      iconUrl: mediaUrl(badge.icon_path) || BADGE_DIFFICULTY_DETAILS[badge.difficulty].icon,
      developerNote: badge.additional_note || undefined,
      displayOrder: badge.display_order,
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
