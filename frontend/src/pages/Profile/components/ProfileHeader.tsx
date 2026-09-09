import { FaInstagram, FaSteam, FaYoutube } from "react-icons/fa";
import { FiUserPlus } from "react-icons/fi";
import { SiBluesky } from "react-icons/si";
import { userchomik } from "../../../assets";
import type { UserProfile } from "../../../hooks/useUserProfile";

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
  return (
    <header className="relative isolate mx-auto w-full max-w-4xl [clip-path:inset(0_-100vw_0_-100vw)]">
      <div className="relative min-h-[35rem] sm:min-h-[33rem] lg:h-[23rem] lg:min-h-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 bg-cover bg-center [mask-image:linear-gradient(to_bottom,#000_0%,#000_26%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_0%,#000_26%,transparent_100%)]"
          style={{ backgroundImage: `url(https://assets.ppy.sh/user-profile-covers/31245051/d1980b379fb235442597240312d267d02472c4970c7261ee4a21135f95a72f50.png)` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full w-screen -translate-x-1/2 bg-linear-to-b from-surface-overlay via-surface-overlay/80 via-[48%] to-primary"
        />

        <div className="absolute inset-x-0 top-0 bottom-6 grid grid-cols-[7rem_minmax(0,1fr)] gap-5 gap-x-4 p-4 sm:top-auto sm:bottom-16 sm:gap-x-6 sm:p-6 lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:gap-7 lg:p-7">
          <div className="w-28">
            <img
              src={profile.avatar_path || userchomik}
              alt={`${profile.username}'s profile`}
              className="border-border bg-surface-soft h-28 w-28 rounded-2xl border object-cover shadow-black"
            />
            <div className="mt-3 grid grid-cols-4 gap-x-1 text-center">
              {socialLinks.map(({ label, icon: Icon }) => (
                <a
                  key={label}
                  href="#profile-social-links"
                  aria-label={label}
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

          <div className="min-w-0 self-start sm:pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-font-primary font-serif text-3xl leading-none sm:text-4xl">{profile.username}</h1>
              <button className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
                <FiUserPlus />
                {isOwnProfile ? "Edit" : "Follow"}
              </button>
            </div>
            <p className="text-font-secondary mt-3 flex items-center gap-2 text-sm">
              <span aria-label="Poland" role="img">🇵🇱</span>
              {profile.country || "Unknown"}
            </p>
            <p className="text-font-secondary mt-3 hidden max-w-3xl leading-relaxed lg:block">
              {profile.bio || "No bio provided."}
            </p>
          </div>

          <p className="text-font-secondary col-span-2 max-w-3xl leading-relaxed lg:hidden">
            {profile.bio || "No bio provided."}
          </p>

          <div className="self-start  lg:col-start-auto lg:justify-self-end lg:pt-1">
            <p className="text-font-primary font-serif text-2xl">Level 24</p>
            <div className="border-border bg-surface-soft mt-3 flex min-w-48 max-w-48 items-center gap-3 rounded-xl border p-3">
              <span aria-label="Difficulty icon placeholder" className="bg-accent-cold h-10 w-10 shrink-0 rounded-sm" />
              <p className="text-font-primary text-sm font-medium">Focused Collector</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ProfileHeader;
