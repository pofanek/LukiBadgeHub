import { Link, useSearchParams } from "react-router-dom";
import { FiAward, FiGlobe } from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import { FocusContent, LoadingIndicator } from "../../components";
import { BADGE_DIFFICULTY_DETAILS, type BadgeDifficultyId } from "../../constants";
import { getCountry } from "../../constants/countries";
import { useAuthUser } from "../../hooks/useAuthUser";
import { type LeaderboardBoard, useLeaderboard } from "../../hooks/useLeaderboard";
import { mediaUrl } from "../../utils/media";

const boards: { value: LeaderboardBoard; label: string }[] = [
  { value: "experience", label: "EXP" },
  { value: "badges", label: "Badges" },
  { value: "difficulty", label: "Badges by difficulty" },
];
const difficulties = Object.keys(BADGE_DIFFICULTY_DETAILS) as BadgeDifficultyId[];

function avatarUrl(path: string | null) {
  return mediaUrl(path);
}

function Rankings() {
  const { user } = useAuthUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const boardParam = searchParams.get("board") as LeaderboardBoard | null;
  const board = boards.some(({ value }) => value === boardParam)
    ? boardParam!
    : "experience";
  const difficultyParam = searchParams.get("difficulty") as BadgeDifficultyId | null;
  const difficulty = difficulties.includes(difficultyParam || "easy")
    ? (difficultyParam || "easy")
    : "easy";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const { entries, position, isLoading, error } = useLeaderboard(
    board,
    difficulty,
    page,
    user?.id,
  );
  const pageCount = entries[0] ? Math.ceil(entries[0].total_players / 100) : 0;
  const podium = entries
    .filter(({ player_rank }) => player_rank <= 3)
    .sort((left, right) => left.player_rank - right.player_rank)
    .slice(0, 3);
  const visibleRanks = page === 1 ? entries.filter(({ player_rank }) => player_rank > 3) : entries;
  const setBoard = (nextBoard: LeaderboardBoard) => {
    const next = new URLSearchParams();
    if (nextBoard !== "experience") next.set("board", nextBoard);
    if (nextBoard === "difficulty") next.set("difficulty", difficulty);
    setSearchParams(next, { replace: true });
  };
  const setDifficulty = (nextDifficulty: BadgeDifficultyId) => {
    setSearchParams({ board: "difficulty", difficulty: nextDifficulty }, { replace: true });
  };
  const scoreLabel = (score: number) => {
    if (board === "experience") return `${score.toLocaleString()} EXP`;
    if (board === "difficulty") {
      return `${score.toLocaleString()} ${BADGE_DIFFICULTY_DETAILS[difficulty].label} badges`;
    }
    return `${score.toLocaleString()} badges`;
  };

  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-7">
          <header className="border-border border-b pb-6">
            <h1 className="text-font-primary font-serif text-4xl sm:text-5xl">Leaderboards</h1>
            <p className="text-font-secondary mt-2 max-w-2xl leading-relaxed">All-time progress earned from completed badge challenges.</p>
          </header>
          <div className="border-border mt-5 flex flex-wrap items-center gap-2 border-b pb-5">
            <button
              type="button"
              onClick={() => setBoard("experience")}
              aria-pressed={board === "experience"}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${board === "experience" ? "border-accent-cold bg-brand-tertiary text-font-primary" : "border-border bg-surface/75 text-font-secondary hover:border-accent-cold hover:text-font-primary"}`}
            >
              EXP leaderboard
            </button>
            <span className="border-border hidden h-7 border-l sm:block" aria-hidden="true" />
            {boards
              .filter(({ value }) => value !== "experience")
              .map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBoard(value)}
                  aria-pressed={board === value}
                  className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${board === value ? "border-accent-cold bg-surface-raised text-font-primary" : "border-border bg-surface/75 text-font-secondary hover:border-accent-cold hover:text-font-primary"}`}
                >
                  {label}
                </button>
              ))}
          </div>
          {board === "difficulty" && <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Badge difficulty">{difficulties.map((item) => {
            const details = BADGE_DIFFICULTY_DETAILS[item];
            const isSelected = item === difficulty;
            return <button key={item} type="button" onClick={() => setDifficulty(item)} aria-pressed={isSelected} style={isSelected ? { borderColor: details.color, color: details.color } : undefined} className={`border-border bg-surface-soft hover:bg-surface-raised rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${isSelected ? "bg-surface-raised" : "text-font-secondary"}`}>{details.label}</button>;
          })}</div>}
          {isLoading ? <div className="py-20"><LoadingIndicator label="Loading leaderboards..." /></div> : error ? <p role="alert" className="text-destructive mt-6 text-sm">{error}</p> : entries.length ? <>
            {page === 1 && <div className="mt-8 grid items-end gap-3 sm:grid-cols-3">{podium.map((entry, podiumPosition) => <PodiumCard key={entry.profile_id} entry={entry} podiumPosition={podiumPosition} scoreLabel={scoreLabel(entry.score)} />)}</div>}
            {position && !entries.some((entry) => entry.profile_id === user?.id) && <div className="border-accent-cold/40 bg-surface-soft mt-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3"><span className="text-font-primary text-sm">Your position</span><span className="text-font-secondary text-sm">#{position.player_rank} · {scoreLabel(position.score)}</span></div>}
            <ol className="border-border bg-surface/75 divide-border mt-6 overflow-hidden rounded-xl border divide-y">{visibleRanks.map((entry) => <RankingRow key={entry.profile_id} entry={entry} scoreLabel={scoreLabel(entry.score)} board={board} />)}</ol>
            {pageCount > 1 && <nav className="mt-7 flex items-center justify-center gap-3" aria-label="Leaderboard pagination"><button type="button" disabled={page === 1} onClick={() => { const next = new URLSearchParams(searchParams); next.set("page", String(page - 1)); setSearchParams(next, { replace: true }); }} className="border-border text-font-secondary hover:text-font-primary rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-45">Previous</button><span className="text-font-muted text-sm">Page {page} of {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => { const next = new URLSearchParams(searchParams); next.set("page", String(page + 1)); setSearchParams(next, { replace: true }); }} className="border-border text-font-secondary hover:text-font-primary rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-45">Next</button></nav>}
          </> : <div className="border-border bg-surface/75 mt-6 rounded-xl border px-5 py-14 text-center"><FiAward className="text-accent-cold mx-auto h-7 w-7" /><h2 className="text-font-primary mt-3 font-serif text-2xl">No ranked players yet</h2><p className="text-font-secondary mt-2 text-sm">Complete a badge challenge to enter the leaderboard.</p></div>}
        </div>
      </section>
    </FocusContent>
  );
}

function PodiumCard({ entry, podiumPosition, scoreLabel }: { entry: import("../../hooks/useLeaderboard").LeaderboardEntry; podiumPosition: number; scoreLabel: string }) {
  const avatar = avatarUrl(entry.avatar_path);
  const country = getCountry(entry.country_code);
  const rankClass = podiumRankClass(entry.player_rank);
  const profilePath = `/profile/${encodeURIComponent(entry.username)}`;
  const placementClass = podiumPosition === 0
    ? "sm:col-start-2 sm:row-start-1 sm:pb-7"
    : podiumPosition === 1
      ? "sm:col-start-1 sm:row-start-1"
      : "sm:col-start-3 sm:row-start-1";

  return <article className={`border-border bg-surface/75 relative rounded-xl border p-4 text-center ${placementClass}`}>{entry.player_rank === 1 && <FaCrown aria-label="First place" className="mx-auto mb-2 h-8 w-8 text-[#f4c542] drop-shadow-[0_2px_6px_rgba(244,197,66,0.45)]" />}<Link to={profilePath} aria-label={`View ${entry.username}'s profile`} className="mx-auto block w-fit rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cold">{avatar ? <img src={avatar} alt="" className="border-border h-16 w-16 rounded-full border object-cover" /> : <span className="bg-brand-tertiary text-font-primary flex h-16 w-16 items-center justify-center rounded-full font-serif text-2xl">{entry.username[0]?.toUpperCase()}</span>}</Link><Link to={profilePath} className="text-font-primary hover:text-hover mt-3 flex items-center justify-center gap-1.5 truncate text-base font-semibold"><span className="truncate">{entry.username}</span><CountryFlag country={country} /></Link><p className="text-font-secondary mt-1 text-sm font-bold">{scoreLabel}</p><span className={`mt-3 block text-4xl font-semibold sm:text-5xl ${rankClass}`}>#{entry.player_rank}</span></article>;
}

function RankingRow({ entry, scoreLabel, board }: { entry: import("../../hooks/useLeaderboard").LeaderboardEntry; scoreLabel: string; board: LeaderboardBoard }) {
  const avatar = avatarUrl(entry.avatar_path);
  const country = getCountry(entry.country_code);
  const profilePath = `/profile/${encodeURIComponent(entry.username)}`;
  return <li className="flex items-center gap-2 px-3 py-3 sm:px-5"><span className="text-accent-cold flex w-16 shrink-0 items-center justify-end gap-1 text-sm font-medium"><span>#{entry.player_rank}</span><CountryFlag country={country} className="px-1" /></span><Link to={profilePath} aria-label={`View ${entry.username}'s profile`} className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cold">{avatar ? <img src={avatar} alt="" className="border-border h-10 w-10 rounded-full border object-cover" /> : <span className="bg-brand-tertiary text-font-primary flex h-10 w-10 items-center justify-center rounded-full font-medium">{entry.username[0]?.toUpperCase()}</span>}</Link><div className="min-w-0 flex-1 ml-1"><Link to={profilePath} className="text-font-primary hover:text-hover block truncate font-medium">{entry.username}</Link><p className="text-font-muted mt-0.5 text-xs">{board === "experience" ? `${entry.earned_badges} badges earned` : `${entry.earned_experience.toLocaleString()} EXP earned`}</p></div><span className="text-font-primary ml-1 shrink-0 text-sm font-bold">{scoreLabel}</span></li>;
}

function CountryFlag({ country, className = "" }: { country: ReturnType<typeof getCountry>; className?: string }) {
  if (country.flag) return <span aria-label={country.name} role="img" title={country.name} className={className}>{country.flag}</span>;
  return <span aria-label="Country not set" title="Country not set" className={`border-border bg-surface-raised text-font-secondary inline-flex h-4 w-5 items-center justify-center rounded-sm border ${className}`}><FiGlobe className="h-3 w-3" /></span>;
}

function podiumRankClass(rank: number) {
  if (rank === 1) return "text-[#f4c542]";
  if (rank === 2) return "text-[#c7d0dc]";
  return "text-[#d28b57]";
}

export default Rankings;
