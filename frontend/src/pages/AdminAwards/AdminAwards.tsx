import { useEffect, useMemo, useState } from "react";
import { FiAward, FiCheck, FiSearch, FiX } from "react-icons/fi";
import {
  BADGE_DIFFICULTY_DETAILS,
  getBadgeDifficultyLabel,
  getBadgeTierLabel,
  type BadgeRow,
  type GameRow,
} from "../../constants";
import { type UserProfile } from "../../hooks/useUserProfile";
import { invalidateLeaderboardCache } from "../../hooks/useLeaderboard";
import { supabase } from "../../utils/supabase";
import { mediaUrl } from "../../utils/media";
import { invalidateCachedQueries } from "../../utils/queryCache";

const awardableDifficulties = new Set(["extreme", "supreme", "inhuman"]);

function badgeIconUrl(badge: BadgeRow) {
  return mediaUrl(badge.icon_path) || BADGE_DIFFICULTY_DETAILS[badge.difficulty].icon;
}

function FeedbackToast({
  message,
  error,
  onDismiss,
}: {
  message: string;
  error: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
      role={error ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}
      >
        <FiAward
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

export default function AdminAwards({ embedded = false }: { embedded?: boolean }) {
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [gameQuery, setGameQuery] = useState("");
  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [isGameSearchOpen, setIsGameSearchOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingBadges, setIsLoadingBadges] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  const inputClass =
    "border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold w-full rounded-lg border px-3 py-2.5 text-sm outline-none";
  const filteredGames = useMemo(() => {
    const query = gameQuery.trim().toLocaleLowerCase();
    return query
      ? games.filter((game) => game.name.toLocaleLowerCase().includes(query))
      : games;
  }, [gameQuery, games]);
  const awardableBadges = useMemo(
    () => badges.filter((badge) => awardableDifficulties.has(badge.difficulty)),
    [badges],
  );
  const selectedBadge = useMemo(
    () => awardableBadges.find((badge) => badge.id === selectedBadgeId) || null,
    [awardableBadges, selectedBadgeId],
  );

  useEffect(() => {
    let active = true;
    supabase
      .from("games")
      .select("id, name, description, developer, publisher, release_date, genres, steam_url, cover_path, cover_position, banner_path, is_published, created_at, updated_at")
      .order("name")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError("Games could not be loaded.");
        else setGames((data || []) as GameRow[]);
        setIsLoadingGames(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = userQuery.trim().replace(/[%_]/g, "");
    if (query.length < 2 || selectedUser?.username === userQuery) return;
    let active = true;
    const timer = window.setTimeout(() => {
      supabase
        .from("user_profiles")
        .select("id, username, bio, country_code, avatar_path, banner_path, pinned_badge_id, username_changed_at, role")
        .ilike("username", `%${query}%`)
        .order("username")
        .limit(8)
        .then(({ data, error: queryError }) => {
          if (!active) return;
          if (queryError) setError("Users could not be searched.");
          else setUserResults((data || []).map((item) => ({ ...item, avatar_url: null, banner_url: null })) as UserProfile[]);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [selectedUser?.username, userQuery]);

  useEffect(() => {
    if (!selectedGame) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setIsLoadingBadges(true);
    });
    supabase
      .from("game_badges")
      .select("*")
      .eq("game_id", selectedGame.id)
      .in("difficulty", ["extreme", "supreme", "inhuman"])
      .order("created_at")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError("Special badges could not be loaded.");
        else setBadges((data || []) as BadgeRow[]);
        setSelectedBadgeId(null);
        setIsLoadingBadges(false);
      });
    return () => {
      active = false;
    };
  }, [selectedGame]);

  const awardBadge = async () => {
    if (!selectedUser || !selectedGame || !selectedBadge) return;
    setError("");
    setNotice("");
    setIsAwarding(true);
    const { error: awardError } = await supabase
      .from("user_badges")
      .insert({ user_id: selectedUser.id, badge_id: selectedBadge.id });
    setIsAwarding(false);
    if (awardError) {
      setError(
        awardError.code === "23505"
          ? `${selectedUser.username} already has this badge.`
          : "The badge could not be awarded. Please try again.",
      );
      return;
    }
    invalidateLeaderboardCache();
    invalidateCachedQueries(`game-players:${selectedGame.id}:`);
    setNotice(`${selectedBadge.name} awarded to ${selectedUser.username}.`);
  };

  const removeBadge = async () => {
    if (!selectedUser || !selectedGame || !selectedBadge) return;
    setError(""); setNotice(""); setIsAwarding(true);
    const { error: removeError } = await supabase.from("user_badges").delete().eq("user_id", selectedUser.id).eq("badge_id", selectedBadge.id);
    setIsAwarding(false);
    if (removeError) return setError("The badge could not be removed. Please try again.");
    invalidateLeaderboardCache(); invalidateCachedQueries(`game-players:${selectedGame.id}:`);
    setNotice(`${selectedBadge.name} removed from ${selectedUser.username}.`);
  };

  return (
    <section className={embedded ? "mt-12" : "min-h-[calc(100vh-4rem)] w-full flex-1 py-8 sm:py-10"}>
      <div className={embedded ? "" : "mx-auto w-full max-w-5xl px-3 sm:px-7 lg:px-10"}>
        <div className="border-border border-b pb-6">
          <header className="border-accent-cold/30 bg-brand-tertiary/35 w-fit max-w-full rounded-xl border p-4 sm:p-5">
            <p className="text-accent-cold text-sm font-medium">CMS</p>
            <h1 className="text-font-primary mt-1 font-serif text-4xl">Award special badges</h1>
            <p className="text-font-secondary mt-2 max-w-2xl">Award an existing Extreme, Supreme, or Inhuman badge from a selected game.</p>
          </header>
        </div>
        <h2 className="text-font-primary mt-6 font-serif text-2xl">Awarding badges</h2>
        <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
          <section className="border-border bg-surface/75 min-h-64 rounded-xl border p-5">
            <h2 className="text-font-primary font-serif text-2xl">1. Select player</h2>
            <label className="relative mt-4 block"><span className="sr-only">Search users</span><FiSearch className="text-font-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" /><input value={userQuery} onChange={(event) => { setUserQuery(event.target.value); setSelectedUser(null); setUserResults([]); }} placeholder="Search by username" className={`${inputClass} pl-9`} /></label>
            {userQuery.trim().length > 0 && userQuery.trim().length < 2 && <p className="text-font-muted mt-2 text-xs">Enter at least 2 characters.</p>}
            {userQuery.trim().length >= 2 && !selectedUser && userResults.length > 0 && <div className="border-border bg-surface mt-2 overflow-hidden rounded-lg border p-1.5">{userResults.map((result) => <button key={result.id} type="button" onClick={() => { setSelectedUser(result); setUserQuery(result.username); setUserResults([]); }} className="text-font-secondary hover:bg-surface-soft hover:text-font-primary flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm"><span>{result.username}</span><span className="text-font-muted text-xs">{result.role}</span></button>)}</div>}
            {selectedUser && <p className="text-font-primary mt-4 rounded-lg bg-brand-tertiary/50 px-3 py-2 text-sm"><FiCheck className="text-accent-cold mr-2 inline" />{selectedUser.username} selected</p>}
          </section>
          <section className="border-border bg-surface/75 min-h-64 rounded-xl border p-5">
            <h2 className="text-font-primary font-serif text-2xl">2. Select game</h2>
            <div className="relative mt-4" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsGameSearchOpen(false); }}>
              <label className="relative block"><span className="sr-only">Search games</span><FiSearch className="text-font-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" /><input value={gameQuery} onFocus={() => setIsGameSearchOpen(true)} onChange={(event) => { setGameQuery(event.target.value); if (selectedGame) { setSelectedGame(null); setBadges([]); setSelectedBadgeId(null); } }} placeholder="Search games" className={`${inputClass} pl-9`} /></label>
              {!isLoadingGames && isGameSearchOpen && <div className="border-border bg-surface absolute z-30 mt-2 max-h-52 w-full overflow-y-auto rounded-lg border p-1.5 shadow-black">{filteredGames.map((game) => <button key={game.id} type="button" onClick={() => { setSelectedGame(game); setGameQuery(game.name); setBadges([]); setSelectedBadgeId(null); setIsGameSearchOpen(false); }} className={`flex w-full rounded-md px-2.5 py-2 text-left text-sm ${selectedGame?.id === game.id ? "bg-brand-tertiary text-font-primary" : "text-font-secondary hover:bg-surface-soft hover:text-font-primary"}`}>{game.name}</button>)}{filteredGames.length === 0 && <p className="text-font-muted px-2.5 py-3 text-sm">No games found.</p>}</div>}
            </div>
            {isLoadingGames ? <p className="text-font-muted mt-3 text-sm">Loading games...</p> : selectedGame && <p className="text-font-primary mt-4 rounded-lg bg-brand-tertiary/50 px-3 py-2 text-sm"><FiCheck className="text-accent-cold mr-2 inline" />{selectedGame.name} selected</p>}
          </section>
        <section className="border-border bg-surface/75 min-h-64 rounded-xl border p-5">
          <h2 className="text-font-primary font-serif text-2xl">3. Select badge</h2>
          {!selectedGame ? <p className="text-font-muted mt-3 text-sm">Select a game to see its special badges.</p> : isLoadingBadges ? <p className="text-font-muted mt-3 text-sm">Loading badges...</p> : awardableBadges.length === 0 ? <p className="text-font-muted mt-3 text-sm">This game has no Extreme, Supreme, or Inhuman badges.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{awardableBadges.map((badge) => <button key={badge.id} type="button" onClick={() => setSelectedBadgeId(badge.id)} className={`border-border bg-surface-soft hover:border-accent-cold flex items-center gap-3 rounded-lg border p-3 text-left ${selectedBadgeId === badge.id ? "border-accent-cold ring-accent-cold/30 ring-2" : ""}`}><img src={badgeIconUrl(badge)} alt="" className="bg-surface-raised h-11 w-11 rounded-full object-cover" /><span><span className="text-font-primary block text-sm font-medium">{badge.name}</span><span className="text-font-muted mt-1 block text-xs">{getBadgeTierLabel(badge.tier)} {getBadgeDifficultyLabel(badge.difficulty)}</span></span></button>)}</div>}
          <button type="button" onClick={awardBadge} disabled={!selectedUser || !selectedGame || !selectedBadge || isAwarding} className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"><FiAward />{isAwarding ? "Awarding..." : "Award badge"}</button>
        </section>
        </div>
        <section className="border-border bg-surface/75 mt-6 rounded-xl border p-5"><h2 className="text-font-primary font-serif text-2xl">Removing badges</h2><p className="text-font-secondary mt-1 text-sm">Use the same selected player, game, and badge above to remove an incorrectly awarded special badge.</p><button type="button" onClick={removeBadge} disabled={!selectedUser || !selectedGame || !selectedBadge || isAwarding} className="border-border text-font-primary hover:bg-effect-glass mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"><FiX />{isAwarding ? "Removing..." : "Remove selected badge"}</button></section>
      </div>
      {(notice || error) && <FeedbackToast message={error || notice} error={Boolean(error)} onDismiss={() => { setNotice(""); setError(""); }} />}
    </section>
  );
}
