import { useEffect, useState } from "react";
import { FiArrowLeft, FiAward } from "react-icons/fi";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FocusContent, LoadingIndicator } from "../../components";
import { userchomik } from "../../assets";
import { useGame } from "../../hooks/useGames";
import { supabase } from "../../utils/supabase";
import { mediaUrl } from "../../utils/media";
import { getCachedQuery } from "../../utils/queryCache";

type GamePlayer = { player_rank: number; profile_id: string; username: string; avatar_path: string | null; badges_collected: number; earned_experience: number };

function avatarUrl(path: string | null) {
  return mediaUrl(path);
}

export default function GamePlayers() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const gameId = Number(id);
  const board = searchParams.get("board") === "experience" ? "experience" : "badges";
  const { game, isLoading: isGameLoading } = useGame(Number.isInteger(gameId) && gameId > 0 ? gameId : undefined);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!gameId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setIsLoading(true);
      setError("");
      setPlayers([]);
    });
    const loadLeaderboard = async () => {
      const { data, error } = await supabase.rpc("get_game_leaderboard", {
        p_board: board,
        p_game_id: gameId,
        p_limit: 100,
      });
      if (error) throw error;
      return (data || []) as GamePlayer[];
    };
    getCachedQuery(
      `game-players:${gameId}:${board}`,
      30_000,
      loadLeaderboard,
    ).then((fallbackPlayers) => {
      if (!active) return;
      setPlayers(fallbackPlayers);
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      setError("Top players could not be loaded.");
      setIsLoading(false);
    });
    return () => { active = false; };
  }, [board, gameId]);

  if (isGameLoading) return <FocusContent><LoadingIndicator label="Loading top players..." /></FocusContent>;
  if (!game) return <FocusContent><p className="text-font-secondary">This game could not be found.</p></FocusContent>;

  const scoreLabel = (player: GamePlayer) => board === "experience" ? `${player.earned_experience.toLocaleString()} EXP` : `${player.badges_collected.toLocaleString()} badges`;
  return <FocusContent><section className="w-full self-stretch py-8 sm:py-10 lg:py-12"><div className="mx-auto w-full max-w-5xl px-3 sm:px-7"><Link to={`/games/${game.id}`} className="text-accent-cold hover:text-hover inline-flex items-center gap-2 text-sm font-medium"><FiArrowLeft /> Back to {game.title}</Link><header className="border-border mt-5 border-b pb-6"><p className="text-accent-cold text-sm font-medium">{game.title}</p><h1 className="text-font-primary mt-1 font-serif text-4xl sm:text-5xl">Top Players</h1><p className="text-font-secondary mt-2">The top 100 players for this game.</p></header><div className="border-border mt-5 flex gap-2 border-b pb-5"><button type="button" onClick={() => setSearchParams({}, { replace: true })} aria-pressed={board === "badges"} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${board === "badges" ? "border-accent-cold bg-brand-tertiary text-font-primary" : "border-border bg-surface/75 text-font-secondary hover:border-accent-cold"}`}>Badges collected</button><button type="button" onClick={() => setSearchParams({ board: "experience" }, { replace: true })} aria-pressed={board === "experience"} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${board === "experience" ? "border-accent-cold bg-brand-tertiary text-font-primary" : "border-border bg-surface/75 text-font-secondary hover:border-accent-cold"}`}>EXP earned</button></div>{isLoading ? <div className="py-16"><LoadingIndicator label="Loading top players..." /></div> : error ? <p role="alert" className="text-destructive mt-6 text-sm">{error}</p> : players.length ? <ol className="border-border bg-surface/75 divide-border mt-6 overflow-hidden rounded-xl border divide-y">{players.map((player) => { const avatar = avatarUrl(player.avatar_path); return <li key={player.profile_id} className="flex items-center gap-3 px-3 py-3 sm:px-5"><span className="text-accent-cold w-10 shrink-0 text-right text-sm font-medium">#{player.player_rank}</span><Link to={`/profile/${encodeURIComponent(player.username)}`} className="shrink-0 rounded-full"><img src={avatar || userchomik} alt="" className="border-border h-10 w-10 rounded-full border object-cover" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = userchomik; }} /></Link><Link to={`/profile/${encodeURIComponent(player.username)}`} className="text-font-primary hover:text-hover min-w-0 flex-1 truncate font-medium">{player.username}</Link><div className="text-right text-xs sm:text-sm"><p className="text-font-primary font-bold">{scoreLabel(player)}</p><p className="text-font-muted mt-0.5">{board === "experience" ? `${player.badges_collected.toLocaleString()} badges collected` : `${player.earned_experience.toLocaleString()} EXP earned`}</p></div></li>; })}</ol> : <div className="border-border bg-surface/75 mt-6 rounded-xl border px-5 py-14 text-center"><FiAward className="text-accent-cold mx-auto h-7 w-7" /><h2 className="text-font-primary mt-3 font-serif text-2xl">No players yet</h2><p className="text-font-secondary mt-2 text-sm">Be the first to unlock a badge for this game.</p></div>}</div></section></FocusContent>;
}
