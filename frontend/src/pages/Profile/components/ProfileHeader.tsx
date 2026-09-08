import { FaInstagram, FaSteam, FaYoutube } from "react-icons/fa";
import { FiUserPlus } from "react-icons/fi";
import { SiBluesky } from "react-icons/si";
import { logo, userchomik } from "../../../assets";

const socialLinks = [
  { label: "Steam", icon: FaSteam },
  { label: "YouTube", icon: FaYoutube },
  { label: "Instagram", icon: FaInstagram },
  { label: "Bluesky", icon: SiBluesky },
];

function ProfileHeader() {
  return (
    <header className="border-border bg-surface-overlay overflow-hidden rounded-2xl border shadow-black">
      <div
        className="relative min-h-[35rem] bg-cover bg-center sm:min-h-[29rem] lg:h-[23rem] lg:min-h-0"
        style={{ backgroundImage: `url(${logo})` }}
      >
        <div className="from-surface-overlay/15 via-surface-overlay/60 to-surface-overlay absolute inset-0 bg-linear-to-b" />

        <div className="absolute inset-x-0 bottom-16 grid gap-5 p-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-6 sm:p-6 lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:gap-7 lg:p-7">
          <div className="w-28">
            <img
              src={userchomik}
              alt="Loliksbol's profile"
              className="border-border bg-surface-soft h-28 w-28 rounded-2xl border object-cover shadow-black"
            />
            <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-2 text-center">
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
            <div className="text-font-muted mt-3 grid grid-cols-3 gap-x-3 text-center text-[10px] leading-tight">
              <span>12<br />mutuals</span>
              <span>86<br />followers</span>
              <span>44<br />following</span>
            </div>
          </div>

          <div className="min-w-0 self-start sm:pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-font-primary font-serif text-3xl leading-none sm:text-4xl">Loliksbol</h1>
              <button className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
                <FiUserPlus />
                Follow
              </button>
            </div>
            <p className="text-font-secondary mt-3 flex items-center gap-2 text-sm">
              <span aria-label="Poland" role="img">🇵🇱</span>
              Poland
            </p>
            <p className="text-font-secondary mt-3 max-w-3xl leading-relaxed">
              Chasing difficult achievements, collecting badges, and always looking for the next game to complete.
            </p>
          </div>

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
