import { FaInstagram, FaSteam, FaThumbtack, FaYoutube } from "react-icons/fa";
import { FiEdit3, FiUserPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import { SiBluesky } from "react-icons/si";
import { userchomik } from "../../../assets";
import { BADGE_DIFFICULTY_DETAILS } from "../../../constants";
import { getCountry } from "../../../constants/countries";
import { usePinnedBadge } from "../../../hooks/usePinnedBadge";
import { usePlayerLevel } from "../../../hooks/usePlayerLevel";
import type { UserProfile } from "../../../hooks/useUserProfile";
import { useSocialLinks } from "../../../hooks/useSocialLinks";
import { supabase } from "../../../utils/supabase";

const socialLinks = [
  { label: "Steam", icon: FaSteam },
  { label: "YouTube", icon: FaYoutube },
  { label: "Instagram", icon: FaInstagram },
  { label: "Bluesky", icon: SiBluesky },
];

type ProfileHeaderProps = {
  profile: UserProfile;
  isOwnProfile: boolean;
};

function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const links = useSocialLinks(profile.id);
  const {
    level,
    isLoading: isLevelLoading,
    hasError: hasLevelError,
  } = usePlayerLevel(profile.id);
  const { pinnedBadge, isLoading: isPinnedBadgeLoading } = usePinnedBadge(
    profile.id,
  );
  const socialLinksByPlatform = new Map(links.map((link) => [link.platform, link.url]));
  const country = getCountry(profile.country_code);
  return (
    <header className="relative isolate mx-auto w-full max-w-4xl [clip-path:inset(0_-100vw_0_-100vw)]">
      <div className="relative md:min-h-[33rem] lg:h-[23rem] lg:min-h-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 bg-cover bg-center [mask-image:linear-gradient(to_bottom,#000_0%,#000_26%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_26%,transparent_100%)]"
          style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 bg-linear-to-b from-surface-soft/70 via-surface-overlay/80 via-[48%] to-primary"
        />

        <div className="relative grid grid-cols-[7rem_minmax(0,1fr)] gap-5 gap-x-4 max-md:gap-y-2 p-4 md:absolute md:inset-x-0 md:top-auto md:bottom-10 md:gap-x-6 md:p-6 lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:gap-7 lg:p-7">
          <div className="w-28">
            <img
              src={profile.avatar_url || userchomik}
              alt={`${profile.username}'s profile`}
              className="border-border bg-surface-soft h-28 w-28 rounded-2xl border object-cover shadow-black"
            />
            <div className="mt-3 grid grid-cols-4 gap-x-1 text-center">
              {socialLinks.filter(({ label }) => socialLinksByPlatform.has(label.toLowerCase() as "steam" | "youtube" | "instagram" | "bluesky")).map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href={socialLinksByPlatform.get(label.toLowerCase() as "steam" | "youtube" | "instagram" | "bluesky")}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="text-font-secondary hover:text-hover flex justify-center transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="text-font-muted mt-4 grid grid-cols-3 gap-x-1 text-center text-[8px] leading-3">
              <span className="whitespace-nowrap">12<br />mutuals</span>
              <span className="whitespace-nowrap">86<br />followers</span>
              <span className="whitespace-nowrap">44<br />following</span>
            </div>
          </div>

          <div className="min-w-0 self-start sm:pt-1 md:pr-72">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-font-primary break-words font-serif text-3xl leading-none sm:text-4xl">{profile.username}</h1>
              {!isOwnProfile && (
                <button className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
                  <FiUserPlus />
                  Follow
                </button>
              )}
            </div>
            <p className="text-font-secondary mt-3 flex items-center gap-2 text-sm">
              {country.flag && <span aria-label={country.name} role="img">{country.flag}</span>}
              {country.name}
            </p>
            <p className="text-font-secondary mt-3 hidden max-w-3xl break-words leading-relaxed lg:block">
              {profile.bio || "No bio provided."}
            </p>
          </div>

          <p className="text-font-secondary col-span-2 max-w-3xl break-words leading-relaxed lg:hidden">
            {profile.bio || "No bio provided."}
          </p>

          <div className="col-span-2 col-start-auto w-full self-start md:absolute md:top-6 md:right-6 md:bottom-auto md:w-72">
            <Link
              to={`/profile/${encodeURIComponent(profile.username)}?tab=stats`}
              className="text-font-primary hover:text-hover flex w-fit items-center gap-2 font-serif text-3xl transition-colors"
              aria-label="View profile statistics"
            >
              <span>Level</span>
              <span className="border-accent-cold text-font-primary grid h-10 w-10 place-items-center rounded-full border text-lg">
                {isLevelLoading || hasLevelError ? "—" : level}
              </span>
            </Link>

            {isOwnProfile && !isPinnedBadgeLoading && !pinnedBadge && (
              <Link
                to="/settings"
                className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              >
                <FiEdit3 />
                Edit pinned badge
              </Link>
            )}

            {!isPinnedBadgeLoading && pinnedBadge && (
              <div className="border-border bg-surface/60 mt-4 rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      pinnedBadge.badge.icon_path
                        ? supabase.storage
                            .from("game-media")
                            .getPublicUrl(pinnedBadge.badge.icon_path).data
                            .publicUrl
                        : BADGE_DIFFICULTY_DETAILS[pinnedBadge.badge.difficulty]
                            .icon
                    }
                    alt=""
                    className="bg-surface-raised h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-font-muted flex items-center gap-1.5 text-xs">
                      <FaThumbtack className="h-3 w-3" />
                      Pinned badge
                    </p>
                    <p className="text-font-primary mt-1 truncate text-sm font-medium">
                      {pinnedBadge.badge.name}
                    </p>
                    <p className="text-font-secondary mt-0.5 truncate text-xs">
                      {pinnedBadge.game.title}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isOwnProfile && pinnedBadge && (
              <Link
                to="/settings"
                className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              >
                <FiEdit3 />
                Edit pinned badge
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default ProfileHeader;
