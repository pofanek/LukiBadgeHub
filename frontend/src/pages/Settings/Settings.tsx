import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiBell,
  FiCamera,
  FiChevronDown,
  FiGlobe,
  FiImage,
  FiLink,
  FiLock,
  FiMail,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { FaInstagram, FaSteam, FaYoutube } from "react-icons/fa";
import { SiBluesky } from "react-icons/si";
import { userchomik } from "../../assets";
import { FocusContent, LoadingIndicator } from "../../components";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useUserProfile } from "../../hooks/useUserProfile";

type SettingsTab = "profile" | "account" | "notifications";

const tabs: { id: SettingsTab; label: string; icon: typeof FiCamera }[] = [
  { id: "profile", label: "Profile", icon: FiCamera },
  { id: "account", label: "Account", icon: FiLock },
  { id: "notifications", label: "Notifications", icon: FiBell },
];

const socialFields = [
  { label: "Steam", placeholder: "Your Steam profile URL", icon: FaSteam },
  { label: "YouTube", placeholder: "Your YouTube channel URL", icon: FaYoutube },
  { label: "Instagram", placeholder: "Your Instagram profile URL", icon: FaInstagram },
  { label: "Bluesky", placeholder: "Your Bluesky profile URL", icon: SiBluesky },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-font-secondary mb-2 block text-sm">{children}</label>;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${className}`}
    />
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-surface/75 rounded-xl border p-4 sm:p-6">
      <div className="max-w-xl">
        <h2 className="text-font-primary font-serif text-2xl">{title}</h2>
        <p className="text-font-muted mt-1 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const { profile, isLoading: isProfileLoading } = useUserProfile(user?.id);

  if (!isAuthLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthLoading || isProfileLoading) {
    return (
      <FocusContent>
        <LoadingIndicator label="Loading settings..." />
      </FocusContent>
    );
  }

  return (
      <section className="bg-[image:var(--bg-image)] flex-1 bg-cover bg-center">
        <div className="min-h-full w-full py-7 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-7">
          <header className="mb-6 sm:mb-8">
            <h1 className="text-font-primary font-serif text-4xl sm:text-5xl">Settings</h1>
            <p className="text-font-secondary mt-2 max-w-xl leading-relaxed">
              Manage how your profile appears and how you sign in to Luki Badge Hub.
            </p>
          </header>

          <nav aria-label="Settings sections" className="border-border mb-5 overflow-x-auto border-b sm:mb-6">
            <div className="flex min-w-max gap-1 sm:min-w-0 sm:gap-4">
              {tabs.map(({ id, label, icon: Icon }) => {
                const isActive = id === activeTab;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`relative flex items-center gap-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-base ${
                      isActive ? "text-font-primary" : "text-font-muted hover:text-font-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    <span className={`bg-accent-cold absolute right-3 bottom-0 left-3 h-0.5 transition-transform sm:right-4 sm:left-4 ${isActive ? "scale-x-100" : "scale-x-0"}`} />
                  </button>
                );
              })}
            </div>
          </nav>

          {activeTab === "profile" && (
            <div className="space-y-4">
              <Section title="Profile appearance" description="Choose the image and cover people see when they visit your profile.">
                <div className="border-border overflow-hidden rounded-xl border">
                  <div
                    className="h-32 bg-cover bg-center sm:h-40"
                    style={{ backgroundImage: "url(https://assets.ppy.sh/user-profile-covers/31245051/d1980b379fb235442597240312d267d02472c4970c7261ee4a21135f95a72f50.png)" }}
                  >
                    <div className="flex h-full items-end justify-end bg-surface-overlay/45 p-3 sm:p-4">
                      <button type="button" className="border-border bg-surface/90 text-font-primary hover:bg-surface-soft inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors">
                        <FiImage /> Change banner
                      </button>
                    </div>
                  </div>
                  <div className="bg-surface-soft/50 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <img src={profile?.avatar_path || userchomik} alt="Your profile avatar" className="border-border bg-surface-raised h-20 w-20 rounded-2xl border object-cover shadow-black" />
                    <div className="min-w-0 flex-1">
                      <p className="text-font-primary font-medium">Profile photo</p>
                      <p className="text-font-muted mt-1 text-sm">Square images work best. JPG, PNG, or WebP.</p>
                    </div>
                    <button type="button" className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
                      <FiUpload /> Change avatar
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Profile details" description="These details appear on your public profile.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Display name</FieldLabel>
                    <Input defaultValue={profile?.username || ""} placeholder="Choose a display name" />
                  </div>
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <div className="relative">
                      <FiGlobe className="text-font-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <select defaultValue={profile?.country || ""} className="border-border bg-surface-soft text-font-primary focus:border-accent-cold w-full appearance-none rounded-lg border py-2.5 pr-10 pl-10 text-sm outline-none transition-colors">
                        <option value="">Select your country</option>
                        <option>Poland</option>
                        <option>United Kingdom</option>
                        <option>United States</option>
                        <option>Germany</option>
                      </select>
                      <FiChevronDown className="text-font-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
                <p className="text-font-muted mt-4 text-xs">Changes are shown as a preview only until profile saving is connected.</p>
              </Section>

              <Section title="Social links" description="Add the places you want visitors to find you. They use the same icons as your public profile.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {socialFields.map(({ label, placeholder, icon: Icon }) => (
                    <label key={label} className="border-border bg-surface-soft/60 focus-within:border-accent-cold flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors">
                      <Icon className="text-font-secondary h-5 w-5 shrink-0" />
                      <span className="sr-only">{label} link</span>
                      <input className="text-font-primary placeholder:text-font-muted min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={placeholder} />
                      <FiLink className="text-font-muted h-4 w-4 shrink-0" />
                    </label>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-4">
              <Section title="Email address" description="Your sign-in email is currently shown below.">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <FieldLabel>Email address</FieldLabel>
                    <div className="relative"><FiMail className="text-font-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" /><Input type="email" defaultValue={user?.email || ""} className="pl-10" /></div>
                  </div>
                  <button type="button" className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors">Change email</button>
                </div>
              </Section>

              <Section title="Password" description="Use a strong, unique password to keep your account secure.">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <FieldLabel>New password</FieldLabel>
                    <div className="relative"><FiLock className="text-font-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" /><Input type="password" placeholder="Enter a new password" className="pl-10" /></div>
                  </div>
                  <button type="button" className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors">Change password</button>
                </div>
              </Section>

              <section className="border-destructive/40 bg-destructive-background/20 rounded-xl border p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl"><h2 className="text-font-primary font-serif text-2xl">Delete account</h2><p className="text-font-secondary mt-1 text-sm leading-relaxed">Permanently delete your profile, badge progress, and account data. This action cannot be undone.</p></div>
                  <button type="button" className="border-destructive/50 text-destructive hover:bg-destructive-background inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"><FiTrash2 /> Delete account</button>
                </div>
              </section>
            </div>
          )}

          {activeTab === "notifications" && (
            <section className="border-border bg-surface/75 flex min-h-72 flex-col items-center justify-center rounded-xl border px-5 text-center">
              <div className="border-border bg-surface-soft flex h-12 w-12 items-center justify-center rounded-xl border"><FiBell className="text-font-secondary h-6 w-6" /></div>
              <h2 className="text-font-primary mt-4 font-serif text-2xl">Notifications are on the way</h2>
              <p className="text-font-muted mt-2 max-w-sm text-sm leading-relaxed">Soon you’ll be able to choose which updates from Luki Badge Hub reach you.</p>
            </section>
          )}
        </div>
        </div>
      </section>
  );
}

export default Settings;
