import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaGamepad, FaSteam, FaStopwatch, FaThumbtack, FaYoutube } from "react-icons/fa";
import {
  FiAlertCircle,
  FiEdit3,
  FiUserCheck,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { userchomik } from "../../../assets";
import { CountryFlag, RoleBadge } from "../../../components";
import {
  BADGE_DIFFICULTY_DETAILS,
  getBadgeExperience,
  getBadgeDifficultyLabel,
  getBadgeTierLabel,
  type BadgeRow,
} from "../../../constants";
import { getCountry } from "../../../constants/countries";
import { usePinnedBadge } from "../../../hooks/usePinnedBadge";
import { usePlayerLevel } from "../../../hooks/usePlayerLevel";
import { useProfileFollows } from "../../../hooks/useProfileFollows";
import type { UserProfile } from "../../../hooks/useUserProfile";
import { useSocialLinks } from "../../../hooks/useSocialLinks";
import { mediaUrl } from "../../../utils/media";

const socialLinks = [
  { label: "Steam", icon: FaSteam },
  { label: "YouTube", icon: FaYoutube },
  { label: "Backloggd", icon: FaGamepad },
  { label: "Speedrun.com", icon: FaStopwatch },
];

const LEVEL_RING_COLORS = [
  "#3d8ef0",
  "#38b7a5",
  "#78b159",
  "#fdcb58",
  "#f4900c",
  "#dd2e44",
  "#aa8ed6",
  "#8bd5ff",
  "#8b5cf6",
  "#e6f1ff",
] as const;

function getLevelRingColor(level: number) {
  const colorIndex = Math.min(
    Math.max(0, Math.floor((level - 1) / 10)),
    LEVEL_RING_COLORS.length - 1,
  );

  return LEVEL_RING_COLORS[colorIndex];
}

type ProfileHeaderProps = {
  profile: UserProfile;
  isOwnProfile: boolean;
  viewerId?: string;
};

function ProfileHeader({
  profile,
  isOwnProfile,
  viewerId,
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const [followError, setFollowError] = useState("");
  const [isPinnedBadgeOpen, setIsPinnedBadgeOpen] = useState(false);
  const links = useSocialLinks(profile.id);
  const {
    level,
    isLoading: isLevelLoading,
    hasError: hasLevelError,
  } = usePlayerLevel(profile.id);
  const { pinnedBadge, isLoading: isPinnedBadgeLoading } = usePinnedBadge(
    profile.id,
  );
  const { counts, isFollowing, isSaving, toggleFollow } = useProfileFollows(
    profile.id,
    viewerId,
  );
  const socialLinksByPlatform = new Map(
    links.map((link) => [link.platform, link.url]),
  );
  const country = getCountry(profile.country_code);
  const profileRole = profile.role;
  const levelRingColor = getLevelRingColor(level);

  useEffect(() => {
    if (!followError) return;
    const timer = window.setTimeout(() => setFollowError(""), 5000);
    return () => window.clearTimeout(timer);
  }, [followError]);

  const handleFollow = async () => {
    if (!viewerId) {
      window.sessionStorage.setItem(
        "luki-post-login-path",
        `${window.location.pathname}${window.location.search}`,
      );
      navigate("/login");
      return;
    }
    try {
      setFollowError("");
      await toggleFollow();
    } catch {
      setFollowError("This profile could not be followed. Please try again.");
    }
  };
  return (
    <header className="relative isolate mx-auto w-full max-w-4xl [clip-path:inset(0_-100vw_0_-100vw)]">
      <div className="relative md:min-h-[33rem] lg:h-[23rem] lg:min-h-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 [mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,transparent_100%)] bg-cover bg-center [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_48%,transparent_100%)]"
          style={
            profile.banner_url
              ? { backgroundImage: `url(${profile.banner_url})` }
              : undefined
          }
        />
        <div
          aria-hidden="true"
          className="from-surface-soft/70 via-surface-overlay/80 to-primary pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 bg-linear-to-b via-[76%]"
        />

        <div className="relative grid grid-cols-[7rem_minmax(0,1fr)] gap-5 gap-x-4 p-4 max-md:gap-y-2 md:absolute md:inset-x-0 md:top-auto md:bottom-10 md:gap-x-6 md:p-6 lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:gap-7 lg:p-7">
          <div className="w-28">
            <img
              src={profile.avatar_url || userchomik}
              alt={`${profile.username}'s profile`}
              className="border-border bg-surface-soft h-28 w-28 rounded-2xl border object-cover shadow-black"
            />
            <div className="mt-3 grid grid-cols-4 gap-x-1 text-center">
              {socialLinks
                .filter(({ label }) =>
                  socialLinksByPlatform.has(
                    label.toLowerCase() as
                      | "steam"
                      | "youtube"
                      | "backloggd"
                      | "speedrun",
                  ),
                )
                .map(({ label, icon: Icon }) => (
                  <a
                    key={label}
                    href={socialLinksByPlatform.get(
                      label.toLowerCase() as
                        | "steam"
                        | "youtube"
                        | "backloggd"
                        | "speedrun",
                    )}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="text-font-secondary hover:text-hover flex justify-center transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
            </div>
            <div className="text-font-muted relative left-[5rem] mt-4 grid w-44 -translate-x-1/2 grid-cols-3 gap-x-3 text-center text-xs leading-4 lg:left-1/2">
              <Link
                to={`/profile/${encodeURIComponent(profile.username)}?tab=mutuals&category=mutuals`}
                className="hover:text-hover whitespace-nowrap transition-colors"
              >
                {counts.mutuals}
                <br />
                mutuals
              </Link>
              <Link
                to={`/profile/${encodeURIComponent(profile.username)}?tab=mutuals&category=followers`}
                className="hover:text-hover whitespace-nowrap transition-colors"
              >
                {counts.followers}
                <br />
                followers
              </Link>
              <Link
                to={`/profile/${encodeURIComponent(profile.username)}?tab=mutuals&category=following`}
                className="hover:text-hover whitespace-nowrap transition-colors"
              >
                {counts.following}
                <br />
                following
              </Link>
            </div>
          </div>

          <div className="min-w-0 self-start sm:pt-1 md:pr-72 lg:pr-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="text-font-primary font-serif text-3xl leading-none break-words sm:text-4xl">
                  {profile.username}
                </h1>
                <RoleBadge role={profileRole} />
              </div>
              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={() => void handleFollow()}
                  disabled={isSaving}
                  className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFollowing ? <FiUserCheck /> : <FiUserPlus />}
                  {isSaving
                    ? "Updating..."
                    : isFollowing
                      ? "Following"
                      : "Follow"}
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <p className="text-font-secondary flex items-center gap-2 text-sm">
              <CountryFlag country={country} />
              {country.name}
              </p>
              {isOwnProfile && profile.country_code === "unknown" && (
                <Link
                  to="/settings"
                  className="text-accent-cold hover:text-font-primary inline-flex items-center gap-1 text-xs font-medium transition-colors"
                >
                  <FiEdit3 className="h-3 w-3" />
                  Edit your country
                </Link>
              )}
            </div>
            <p className="text-font-secondary mt-3 hidden max-w-3xl leading-relaxed break-words lg:block">
              {profile.bio || "No bio provided."}
            </p>
          </div>

          <p className="text-font-secondary col-span-2 max-w-3xl leading-relaxed break-words lg:hidden">
            {profile.bio || "No bio provided."}
          </p>

          <div
            className={`col-span-2 col-start-auto w-full self-start md:absolute md:right-0 md:bottom-auto md:w-72 ${!profile.hide_pinned_badge_edit ? (pinnedBadge ? "md:top-3" : "md:top-6") : pinnedBadge ? "md:top-6" : "md:top-9"}`}
          >
            <div className="ml-auto w-fit max-w-full">
              <div className="flex justify-center">
                <Link
                  to={`/profile/${encodeURIComponent(profile.username)}?tab=stats`}
                  className="text-font-primary hover:text-hover flex w-fit items-center gap-2 font-serif text-3xl transition-colors"
                  aria-label="View profile statistics"
                >
                  <span>Level</span>
                  <span
                    className="text-font-primary grid h-10 w-10 place-items-center rounded-full border text-lg transition-[border-color,box-shadow,background-color]"
                    style={{
                      borderColor: levelRingColor,
                      backgroundColor: `${levelRingColor}14`,
                      boxShadow: `0 0 14px ${levelRingColor}38`,
                    }}
                  >
                    {isLevelLoading || hasLevelError ? "—" : level}
                  </span>
                </Link>
              </div>

              {isOwnProfile &&
                !profile.hide_pinned_badge_edit &&
                !isPinnedBadgeLoading &&
                !pinnedBadge && (
                  <div className="mt-3 flex justify-center">
                    <Link
                      to="/settings"
                      className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <FiEdit3 />
                      Edit pinned badge
                    </Link>
                  </div>
                )}

              <div className="flex justify-center">
                {!isPinnedBadgeLoading && pinnedBadge && (
                  <button type="button" onClick={() => setIsPinnedBadgeOpen(true)} className="border-border bg-surface/60 hover:border-accent-cold mt-4 w-fit max-w-full rounded-xl border p-3 text-left transition-colors" aria-label={`View ${pinnedBadge.badge.name} details`}>
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          mediaUrl(pinnedBadge.badge.icon_path) || BADGE_DIFFICULTY_DETAILS[pinnedBadge.badge.difficulty].icon
                        }
                        alt=""
                        className="bg-surface-raised h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-font-muted flex items-center gap-1.5 text-xs">
                          <FaThumbtack className="h-3 w-3" />
                          Pinned badge
                          <span aria-hidden="true">•</span>
                          <span
                            style={{
                              color:
                                BADGE_DIFFICULTY_DETAILS[
                                  pinnedBadge.badge.difficulty
                                ].color,
                            }}
                          >
                            {getBadgeDifficultyLabel(
                              pinnedBadge.badge.difficulty,
                            )}
                          </span>
                        </p>
                        <p className="text-font-primary mt-1 truncate text-sm font-medium">
                          {pinnedBadge.badge.name}
                        </p>
                        <p className="text-font-secondary mt-0.5 truncate text-xs">
                          {pinnedBadge.game.title}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
              {isOwnProfile && !profile.hide_pinned_badge_edit && pinnedBadge && (
                <div className="mt-3 flex justify-center">
                  <Link
                    to="/settings"
                    className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                  >
                    <FiEdit3 />
                    Edit pinned badge
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {followError && (
        <div
          className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          role="alert"
          aria-live="polite"
        >
          <div className="border-surface-raised bg-destructive-background text-font-primary flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black">
            <FiAlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
            <p className="min-w-0 flex-1 text-sm leading-relaxed">
              {followError}
            </p>
            <button
              type="button"
              onClick={() => setFollowError("")}
              className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1"
              aria-label="Dismiss notification"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {isPinnedBadgeOpen && pinnedBadge && <PinnedBadgeDialog profileName={profile.username} badge={pinnedBadge.badge} gameTitle={pinnedBadge.game.title} onClose={() => setIsPinnedBadgeOpen(false)} />}
    </header>
  );
}

function LinkifiedText({ value }: { value: string }) {
  return <>{value.split(/(https?:\/\/[^\s]+)/g).map((part, index) => /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noreferrer" className="text-accent-cold hover:text-hover underline break-all">{part}</a> : part)}</>;
}

export function PinnedBadgeDialog({ profileName, badge, gameTitle, onClose }: { profileName: string; badge: BadgeRow; gameTitle: string; onClose: () => void }) {
  const difficulty = BADGE_DIFFICULTY_DETAILS[badge.difficulty];
  return createPortal(<div role="presentation" onClick={onClose} className="bg-surface-overlay/80 fixed inset-0 z-50 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label={`${badge.name} details`} onClick={(event) => event.stopPropagation()} className="border-border bg-surface-raised max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl border p-5 shadow-black sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm" style={{ color: difficulty.color }}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: difficulty.color }} />{getBadgeTierLabel(badge.tier)} {difficulty.label}</p><h3 className="text-font-primary mt-1 font-serif text-2xl">{badge.name}</h3><p className="text-font-muted mt-1 text-sm">{gameTitle}</p></div><button type="button" onClick={onClose} aria-label="Close badge details" className="text-font-muted hover:text-font-primary rounded p-1"><FiX className="h-5 w-5" /></button></div><p className="text-font-secondary mt-5 whitespace-pre-wrap break-words text-base leading-relaxed"><LinkifiedText value={badge.description} /></p><div className="border-border mt-5 flex items-center justify-between gap-3 border-t pt-4"><span className="text-font-secondary inline-flex items-center gap-2 text-sm"><span className="border-accent-cold bg-brand-tertiary text-font-primary flex h-4 w-4 shrink-0 items-center justify-center rounded border">✓</span><span>Completed by {profileName}</span></span><span className="text-font-secondary text-sm">{getBadgeExperience(badge.difficulty, badge.tier).toLocaleString()} EXP</span></div>{badge.additional_note && <details className="border-border mt-5 border-t pt-4"><summary className="text-font-primary cursor-pointer text-sm font-bold">Additional note</summary><p className="text-font-secondary mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed"><LinkifiedText value={badge.additional_note} /></p></details>}</div></div>, document.body);
}

export default ProfileHeader;
