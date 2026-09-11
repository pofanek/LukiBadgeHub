import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FiAlertCircle, FiBell, FiCamera, FiCheckCircle, FiImage, FiLock, FiMail, FiSave, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import { FaDiscord, FaInstagram, FaSteam, FaYoutube } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { SiBluesky } from "react-icons/si";
import type { IconType } from "react-icons";
import type { UserIdentity } from "@supabase/supabase-js";
import { userchomik } from "../../assets";
import { PasswordRequirements, FocusContent, LoadingIndicator } from "../../components";
import { useAuthUser } from "../../hooks/useAuthUser";
import { saveUserProfile, useUserProfile } from "../../hooks/useUserProfile";
import { publishSocialLinks, type SocialPlatform, useSocialLinks } from "../../hooks/useSocialLinks";
import { passwordIsValid } from "../../utils/password";
import { supabase } from "../../utils/supabase";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { CountrySelect, ImageCropDialog } from "./components";

type SettingsTab = "profile" | "account" | "notifications";
type CropTarget = { file: File; kind: "avatar" | "banner" };
const tabs = [{ id: "profile", label: "Profile", icon: FiCamera }, { id: "account", label: "Account", icon: FiLock }, { id: "notifications", label: "Notifications", icon: FiBell }] as const;
const socialFields: { platform: SocialPlatform; label: string; placeholder: string; icon: typeof FaSteam }[] = [
  { platform: "steam", label: "Steam", placeholder: "Your Steam profile URL", icon: FaSteam },
  { platform: "youtube", label: "YouTube", placeholder: "Your YouTube channel URL", icon: FaYoutube },
  { platform: "instagram", label: "Instagram", placeholder: "Your Instagram profile URL", icon: FaInstagram },
  { platform: "bluesky", label: "Bluesky", placeholder: "Your Bluesky profile URL", icon: SiBluesky },
];
const oauthProviders = [
  { provider: "google", label: "Google", icon: FcGoogle },
  { provider: "discord", label: "Discord", icon: FaDiscord },
] as const satisfies readonly { provider: "google" | "discord"; label: string; icon: IconType }[];

function providerLabel(provider: string) {
  return oauthProviders.find((item) => item.provider === provider)?.label || provider;
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="border-border bg-surface/75 rounded-xl border p-4 sm:p-6"><div className="max-w-xl"><h2 className="text-font-primary font-serif text-2xl">{title}</h2><p className="text-font-muted mt-1 text-sm leading-relaxed">{description}</p></div><div className="mt-5">{children}</div></section>;
}
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold w-full rounded-lg border px-3 py-2.5 text-sm outline-none ${className}`} />;
}
function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return <p className={`mt-3 text-sm ${error ? "text-destructive" : "text-font-secondary"}`} role={error ? "alert" : "status"}>{message}</p>;
}

function settingsError(reason: unknown, fallback: string, usernameChangedAt?: string | null) {
  const message = reason instanceof Error
    ? reason.message
    : typeof reason === "object" && reason && "message" in reason && typeof reason.message === "string"
      ? reason.message
      : "";
  const code = typeof reason === "object" && reason && "code" in reason && typeof reason.code === "string" ? reason.code : "";
  const details = typeof reason === "object" && reason && "details" in reason && typeof reason.details === "string" ? reason.details : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("username can only be changed once per month")) {
    const changedAt = usernameChangedAt ? new Date(usernameChangedAt) : null;
    if (changedAt && !Number.isNaN(changedAt.getTime())) {
      const nextChange = new Date(changedAt);
      nextChange.setMonth(nextChange.getMonth() + 1);
      const remainingDays = Math.max(1, Math.ceil((nextChange.getTime() - Date.now()) / 86_400_000));
      return `Username change is on cooldown. Try again in ${remainingDays}d.`;
    }
    return "Username change is on cooldown. Try again next month.";
  }
  if (normalized.includes("username is reserved") || (code === "23505" && details.toLowerCase().includes("username")) || (normalized.includes("duplicate key") && normalized.includes("username"))) return "That username is already in use. Please choose another one.";
  if (normalized.includes("username cannot be empty")) return "Username cannot be empty.";
  if (code === "invalid_credentials" || normalized.includes("invalid login credentials") || normalized.includes("current password is incorrect")) return "Your current password is incorrect.";
  if (normalized.includes("enter your current password")) return "Enter your current password to continue.";
  if (code === "over_email_send_rate_limit" || normalized.includes("email rate limit")) return "Too many emails were requested. Please wait a moment and try again.";
  if (code === "email_exists" || normalized.includes("already registered") || normalized.includes("email already")) return "That email address is already in use.";
  if (code === "email_not_confirmed") return "Confirm your email address before making that change.";
  if (code === "manual_linking_disabled" || normalized.includes("manual linking is disabled")) return "OAuth account linking is disabled in Supabase. Enable Allow manual linking in Auth settings.";
  if (normalized.includes("invalid email")) return "Enter a valid email address.";
  if (normalized.includes("type delete to confirm")) return "Type DELETE exactly to confirm account deletion.";
  if (normalized.includes("deletion verification expired")) return "Your deletion verification expired. Enter your password and start again.";
  if (normalized.includes("latest deletion verification email")) return "Open the latest deletion verification email, then try again.";
  if (normalized.includes("verify your email before deleting")) return "Verify your email from the deletion link before deleting your account.";
  if (normalized.includes("account deletion is not configured")) return "Account deletion is temporarily unavailable. Please contact support.";
  if (normalized.includes("jwt") || normalized.includes("session") || normalized.includes("not authenticated")) return "Your session has expired. Please sign in again.";
  if (normalized.includes("row-level security") || normalized.includes("permission denied") || normalized.includes("not authorized")) return "You do not have permission to make that change.";
  if (normalized.includes("network") || normalized.includes("failed to fetch")) return "Could not connect. Check your internet connection and try again.";
  return fallback;
}

async function edgeFunctionSettingsError(reason: unknown, fallback: string) {
  if (reason instanceof FunctionsHttpError) {
    const payload = await reason.context.json().catch(() => null) as { error?: unknown } | null;
    if (typeof payload?.error === "string") return settingsError(new Error(payload.error), fallback);
  }
  return settingsError(reason, fallback);
}

function FeedbackToast({ message, error, onDismiss }: { message: string; error: boolean; onDismiss: () => void }) {
  const Icon = error ? FiAlertCircle : FiCheckCircle;
  return <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2" role={error ? "alert" : "status"} aria-live="polite"><div className={`border-surface-raised flex items-start gap-3 rounded-xl border px-4 py-3 shadow-black ${error ? "bg-destructive-background text-font-primary" : "bg-surface text-font-primary"}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-destructive" : "text-accent-cold"}`} /><p className="min-w-0 flex-1 text-sm leading-relaxed">{message}</p><button type="button" onClick={onDismiss} className="text-font-secondary hover:text-font-primary -mr-1 rounded p-1" aria-label="Dismiss notification"><FiX className="h-4 w-4" /></button></div></div>;
}

function ConfirmationDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="bg-surface-overlay/85 fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-account-dialog-title"><div className="border-border bg-surface w-full max-w-md rounded-xl border p-5 shadow-black sm:p-6"><div className="flex items-start justify-between gap-4"><h2 id="delete-account-dialog-title" className="text-font-primary font-serif text-2xl">{title}</h2><button type="button" onClick={onClose} className="text-font-muted hover:text-font-primary text-sm">Cancel</button></div>{children}</div></div>;
}

function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profileForm, setProfileForm] = useState({ username: "", bio: "", country_code: "unknown" });
  const [socialValues, setSocialValues] = useState<Record<SocialPlatform, string>>({ steam: "", youtube: "", instagram: "", bluesky: "" });
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalDeleteDialog, setShowFinalDeleteDialog] = useState(false);
  const [deletionEmailSent, setDeletionEmailSent] = useState(false);
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<boolean | null>(null);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [identitiesLoading, setIdentitiesLoading] = useState(true);
  const [identityBusy, setIdentityBusy] = useState<string | null>(null);
  const deletionCallbackHandled = useRef(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const userId = user?.id;
  const { profile, isLoading: isProfileLoading } = useUserProfile(user?.id);
  const links = useSocialLinks(user?.id);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  useEffect(() => {
    if (profile) setProfileForm({ username: profile.username, bio: profile.bio || "", country_code: profile.country_code });
  }, [profile]);
  useEffect(() => {
    const nextValues: Record<SocialPlatform, string> = { steam: "", youtube: "", instagram: "", bluesky: "" };
    links.forEach((link) => { nextValues[link.platform] = link.url; });
    setSocialValues(nextValues);
  }, [links]);
  useEffect(() => {
    if (user) { setEmail(user.email || ""); setPendingEmail(user.new_email || ""); }
  }, [user]);
  useEffect(() => {
    let isCurrent = true;
    if (!userId) return () => { isCurrent = false; };
    supabase.rpc("current_user_has_password").then(({ data, error: statusError }) => {
      if (isCurrent) setPasswordStatus(statusError ? false : data === true);
    });
    return () => { isCurrent = false; };
  }, [userId]);
  useEffect(() => {
    let isCurrent = true;
    if (!userId) return () => { isCurrent = false; };
    setIdentitiesLoading(true);
    supabase.auth.getUserIdentities().then(({ data }) => {
      if (isCurrent) {
        setIdentities(data?.identities || []);
        setIdentitiesLoading(false);
      }
    }).catch(() => {
      if (isCurrent) setIdentitiesLoading(false);
    });
    return () => { isCurrent = false; };
  }, [userId]);
  useEffect(() => {
    const provider = new URLSearchParams(window.location.search).get("identity-linked");
    if (!user || !provider || !oauthProviders.some((item) => item.provider === provider)) return;
    window.history.replaceState({}, "", "/settings");
    setActiveTab("account");
    setNotice(`${providerLabel(provider)} sign-in connected.`);
    supabase.auth.getUserIdentities().then(({ data }) => setIdentities(data?.identities || [])).catch(() => undefined);
  }, [user]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (!user || query.get("delete-email-verification") !== "1" || deletionCallbackHandled.current) return;
    deletionCallbackHandled.current = true;
    window.history.replaceState({}, "", "/settings");
    setDeletionBusy(true);
    supabase.functions.invoke("delete-account", { body: { action: "verify-email" } }).then(async ({ error: verificationError }) => {
      setDeletionBusy(false);
      setActiveTab("account");
      if (verificationError) {
        setError(await edgeFunctionSettingsError(verificationError, "Email verification could not be completed."));
        return;
      }
      setNotice("Email verified. Review the final confirmation to permanently delete your account.");
      setShowFinalDeleteDialog(true);
    });
  }, [user]);

  if (!isAuthLoading && !user) return <Navigate to="/login" replace />;
  if (isAuthLoading || isProfileLoading || !user) return <FocusContent><LoadingIndicator label="Loading settings..." /></FocusContent>;

  const clearFeedback = () => { setNotice(""); setError(""); };
  const saveDetails = async () => {
    clearFeedback();
    const username = profileForm.username.trim();
    if (!username) return setError("Username cannot be empty.");
    if (profileForm.bio.length > 300) return setError("Bio must be 300 characters or fewer.");
    setSaving(true);
    try { await saveUserProfile(user.id, { username, bio: profileForm.bio.trim() || null, country_code: profileForm.country_code }); setNotice("Profile details saved."); }
    catch (reason) { setError(settingsError(reason, "Profile details could not be saved.", profile?.username_changed_at)); }
    finally { setSaving(false); }
  };
  const chooseImage = (kind: CropTarget["kind"], file?: File) => {
    clearFeedback();
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Images must be 5 MB or smaller.");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError("Use a JPG, PNG, or WebP image.");
    setCropTarget({ file, kind });
  };
  const saveImage = async (file: File) => {
    if (!cropTarget || !profile) return;
    const path = `${user.id}/${cropTarget.kind}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { contentType: "image/webp", cacheControl: "31536000" });
    if (uploadError) throw new Error(settingsError(uploadError, "The image could not be uploaded."));
    const field = cropTarget.kind === "avatar" ? "avatar_path" : "banner_path";
    const previousPath = profile[field];
    try {
      await saveUserProfile(user.id, { [field]: path });
      if (previousPath && !previousPath.startsWith("http")) await supabase.storage.from("profile-media").remove([previousPath]);
      setCropTarget(null); setNotice(`${cropTarget.kind === "avatar" ? "Avatar" : "Banner"} updated.`);
    } catch (reason) {
      await supabase.storage.from("profile-media").remove([path]);
      throw new Error(settingsError(reason, "The image could not be saved."));
    }
  };
  const validUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } };
  const saveSocial = async (platform: SocialPlatform) => {
    clearFeedback();
    const value = socialValues[platform].trim();
    if (value && !validUrl(value)) return setError("Social links must be complete http:// or https:// URLs.");
    const nextLinks = links.filter((link) => link.platform !== platform);
    const { error: socialError } = value
      ? await supabase.from("user_social_links").upsert({ profile_id: user.id, platform, url: value }, { onConflict: "profile_id,platform" })
      : await supabase.from("user_social_links").delete().eq("profile_id", user.id).eq("platform", platform);
    if (socialError) return setError(settingsError(socialError, "The social link could not be saved."));
    if (value) nextLinks.push({ profile_id: user.id, platform, url: value });
    publishSocialLinks(user.id, nextLinks);
    setNotice(value ? `${socialFields.find((field) => field.platform === platform)?.label} link saved.` : "Social link removed.");
  };
  const changeEmail = async () => {
    clearFeedback();
    if (!email || email === user.email) return setError("Enter a new email address.");
    const { data, error: emailError } = await supabase.auth.updateUser({ email }, { emailRedirectTo: `${window.location.origin}/auth/callback` });
    if (emailError) return setError(settingsError(emailError, "The email address could not be changed."));
    setPendingEmail(data.user?.new_email || email); setNotice(`Confirmation sent to ${email}. Your sign-in email stays unchanged until you confirm it.`);
  };
  const hasPassword = passwordStatus === true;
  const setPassword = async () => {
    clearFeedback();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email || "", { redirectTo: `${window.location.origin}/reset-password` });
    if (resetError) return setError(settingsError(resetError, "The password setup email could not be sent."));
    setNotice("Password setup link sent. After saving a password there, you can use Change password here.");
  };
  const changePassword = async () => {
    clearFeedback();
    if (!passwordIsValid(newPassword)) return setError("Your new password must meet every requirement below.");
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email || "", password: currentPassword });
    if (reauthError) return setError("Your current password is incorrect.");
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    if (passwordError) return setError(settingsError(passwordError, "The password could not be changed."));
    setCurrentPassword(""); setNewPassword(""); setNotice("Password changed.");
  };
  const beginAccountDeletion = async () => {
    clearFeedback();
    if (deleteConfirmation !== "DELETE") return setError('Type DELETE exactly to confirm account deletion.');
    if (!deletePassword) return setError("Enter your current password to continue.");
    setDeletionBusy(true);
    const { error: verificationError } = await supabase.functions.invoke("delete-account", { body: { action: "begin", currentPassword: deletePassword } });
    if (verificationError) { setDeletionBusy(false); return setError(await edgeFunctionSettingsError(verificationError, "Account deletion could not be started.")); }
    window.localStorage.setItem("luki-pending-account-deletion", "1");
    const { error: emailVerificationError } = await supabase.auth.signInWithOtp({
      email: user.email || "",
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?delete-email-verification=1` },
    });
    setDeletionBusy(false);
    if (emailVerificationError) {
      window.localStorage.removeItem("luki-pending-account-deletion");
      return setError(settingsError(emailVerificationError, "The verification email could not be sent."));
    }
    setShowDeleteDialog(false);
    setDeletionEmailSent(true);
    setDeletePassword("");
    setNotice(`A verification link was sent to ${user.email}. Open it within 15 minutes to continue.`);
  };
  const deleteAccount = async () => {
    clearFeedback();
    setDeletionBusy(true);
    const { error: deletionError } = await supabase.functions.invoke("delete-account", { body: { action: "delete", confirmation: "DELETE" } });
    if (deletionError) { setDeletionBusy(false); return setError(await edgeFunctionSettingsError(deletionError, "The account could not be deleted.")); }
    await supabase.auth.signOut({ scope: "local" });
    navigate("/goodbye", { replace: true });
  };
  const linkIdentity = async (provider: "google" | "discord") => {
    clearFeedback();
    setIdentityBusy(provider);
    window.sessionStorage.setItem("luki-post-login-path", `/settings?identity-linked=${provider}`);
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (linkError) {
      window.sessionStorage.removeItem("luki-post-login-path");
      setIdentityBusy(null);
      setError(settingsError(linkError, `${providerLabel(provider)} could not be connected.`));
    }
  };
  const unlinkIdentity = async (identity: UserIdentity) => {
    clearFeedback();
    setIdentityBusy(identity.provider);
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
    if (unlinkError) {
      setIdentityBusy(null);
      return setError(settingsError(unlinkError, `${providerLabel(identity.provider)} could not be removed.`));
    }
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities || []);
    setIdentityBusy(null);
    setNotice(`${providerLabel(identity.provider)} sign-in removed.`);
  };

  return <section className="flex-1"><div className="min-h-full w-full py-7 sm:py-10 lg:py-12"><div className="mx-auto w-full max-w-5xl px-3 sm:px-7">
    <header className="mb-6 sm:mb-8"><h1 className="text-font-primary font-serif text-4xl sm:text-5xl">Settings</h1><p className="text-font-secondary mt-2 max-w-xl leading-relaxed">Manage how your profile appears and how you sign in to Luki Badge Hub.</p></header>
    <nav aria-label="Settings sections" className="border-border mb-5 overflow-x-auto border-b sm:mb-6"><div className="flex min-w-max gap-1 sm:gap-4">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`relative flex items-center gap-2 px-3 py-3.5 text-sm font-medium whitespace-nowrap sm:px-4 sm:text-base ${activeTab === id ? "text-font-primary" : "text-font-muted hover:text-font-secondary"}`}><Icon className="h-4 w-4" />{label}<span className={`bg-accent-cold absolute right-3 bottom-0 left-3 h-0.5 ${activeTab === id ? "scale-x-100" : "scale-x-0"}`} /></button>)}</div></nav>
    {activeTab === "profile" && <div className="space-y-4">
      <Section title="Profile appearance" description="Crop, zoom, and save the images people see on your profile."><div className="border-border overflow-hidden rounded-xl border"><div className="h-32 bg-surface-overlay bg-cover bg-center sm:h-40" style={profile?.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined}><div className="flex h-full items-end justify-end bg-surface-overlay/45 p-3"><button type="button" onClick={() => bannerInput.current?.click()} className="border-border bg-surface/90 text-font-primary rounded-lg border px-3 py-2 text-sm"><FiImage className="mr-2 inline" />Change banner</button></div></div><div className="bg-surface-soft/50 flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><img src={profile?.avatar_url || userchomik} alt="Your profile avatar" className="border-border bg-surface-raised h-20 w-20 rounded-2xl border object-cover shadow-black" /><div className="min-w-0 flex-1"><p className="text-font-primary font-medium">Profile photo</p><p className="text-font-muted mt-1 text-sm">JPG, PNG, or WebP up to 5 MB. Large images are downscaled to fit 2000px.</p></div><button type="button" onClick={() => avatarInput.current?.click()} className="border-border bg-brand-secondary text-font-primary rounded-lg border px-3 py-2 text-sm font-medium"><FiUpload className="mr-2 inline" />Change avatar</button></div></div><input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseImage("avatar", event.target.files?.[0]); event.target.value = ""; }} /><input ref={bannerInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { chooseImage("banner", event.target.files?.[0]); event.target.value = ""; }} /></Section>
      <Section title="Profile details" description="These details appear on your public profile."><div className="grid gap-4 sm:grid-cols-2"><label className="text-font-secondary text-sm">Username<Input value={profileForm.username} onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })} className="mt-2" /><span className="text-font-muted mt-1 block text-xs">Your profile URL uses this name. <strong className="text-font-secondary font-semibold">You can change it once per month.</strong></span></label><div className="text-font-secondary text-sm">Country<CountrySelect value={profileForm.country_code} onChange={(country_code) => setProfileForm({ ...profileForm, country_code })} /></div></div><label className="text-font-secondary mt-4 block text-sm">Bio<textarea value={profileForm.bio} maxLength={300} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} className="border-border bg-surface-soft text-font-primary placeholder:text-font-muted focus:border-accent-cold mt-2 min-h-28 w-full rounded-lg border px-3 py-2.5 text-sm outline-none" placeholder="Tell people a little about yourself." /></label><div className="mt-4 flex items-center justify-between gap-3"><span className="text-font-muted text-xs">{profileForm.bio.length}/300</span><button type="button" onClick={saveDetails} disabled={saving} className="bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"><FiSave className="mr-2 inline" />Save profile</button></div></Section>
      <Section title="Social links" description="Use the same services shown on your public profile."><div className="grid gap-3 sm:grid-cols-2">{socialFields.map(({ platform, label, placeholder, icon: Icon }) => <div key={platform} className="border-border bg-surface-soft/60 focus-within:border-accent-cold flex items-center gap-3 rounded-lg border px-3 py-2.5"><Icon className="text-font-secondary h-5 w-5 shrink-0" /><label className="sr-only" htmlFor={`${platform}-link`}>{label} link</label><input id={`${platform}-link`} value={socialValues[platform]} onChange={(event) => setSocialValues({ ...socialValues, [platform]: event.target.value })} className="text-font-primary placeholder:text-font-muted min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder={placeholder} /><button type="button" onClick={() => saveSocial(platform)} className="border-border text-font-secondary hover:text-font-primary rounded-md border px-2 py-1 text-xs font-medium" aria-label={`Save ${label} link`}>Save</button></div>)}</div></Section>
    </div>}
    {activeTab === "account" && <div className="space-y-4"><Section title="Email address" description="A confirmation link is sent to the new address before your sign-in email changes."><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="text-font-secondary min-w-0 flex-1 text-sm">Email address<div className="relative mt-2"><FiMail className="text-font-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" /></div></label><button type="button" onClick={changeEmail} className="bg-brand-secondary text-font-primary rounded-lg px-3 py-2.5 text-sm font-medium">Change email</button></div>{pendingEmail && <Notice message={`Waiting for confirmation from ${pendingEmail}.`} />}</Section>
      <Section title="Sign-in methods" description="Connect Google or Discord so you have another way to access this account."><div className="space-y-3">{oauthProviders.map(({ provider, label, icon: Icon }) => { const identity = identities.find((item) => item.provider === provider); const canUnlink = identities.length > 1; return <div key={provider} className="border-border bg-surface-soft/60 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><Icon className="h-6 w-6 shrink-0" /><div><p className="text-font-primary text-sm font-medium">{label}</p><p className="text-font-muted mt-0.5 text-xs">{identitiesLoading ? "Checking connection..." : identity ? "Connected" : "Not connected"}</p></div></div>{identity ? <button type="button" onClick={() => unlinkIdentity(identity)} disabled={!canUnlink || identityBusy !== null} title={!canUnlink ? "Connect another sign-in method before removing this one." : undefined} className="border-border text-font-secondary hover:text-font-primary rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">{identityBusy === provider ? "Removing..." : "Remove"}</button> : <button type="button" onClick={() => linkIdentity(provider)} disabled={identitiesLoading || identityBusy !== null} className="bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">{identityBusy === provider ? "Connecting..." : `Connect ${label}`}</button>}</div>; })}</div><p className="text-font-muted mt-3 text-xs leading-relaxed">You can only remove a sign-in method when another method remains connected.</p></Section>
      <Section title={hasPassword ? "Password" : "Set password"} description={hasPassword ? "Enter your current password before choosing a new one." : "We’ll send a recovery link to your account email so you can add password sign-in without removing OAuth."}>{hasPassword ? <><label className="text-font-secondary block text-sm">Current password<Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2" /></label><label className="text-font-secondary mt-4 block text-sm">New password<Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2" /></label><PasswordRequirements password={newPassword} /><button type="button" onClick={changePassword} className="bg-brand-secondary text-font-primary mt-4 rounded-lg px-3 py-2.5 text-sm font-medium">Change password</button></> : <button type="button" onClick={setPassword} className="bg-brand-secondary text-font-primary rounded-lg px-3 py-2.5 text-sm font-medium">Send password setup link</button>}</Section>
      <section className="border-destructive/40 bg-destructive-background/20 rounded-xl border p-4 sm:p-6"><h2 className="text-font-primary font-serif text-2xl">Delete account</h2><p className="text-font-secondary mt-1 max-w-xl text-sm leading-relaxed">This permanently removes your profile, social links, media, and future badge progress. It cannot be undone. To protect your account, you must enter your password, verify the deletion from your email, and make a final confirmation.</p>{!hasPassword && <Notice message="Set a password from the section above before deleting an OAuth-only account." error />}{deletionEmailSent && <Notice message="Verification email sent. Open its link within 15 minutes to unlock the final confirmation." />}<button type="button" onClick={() => { clearFeedback(); setShowDeleteDialog(true); }} disabled={!hasPassword || deletionBusy} className="border-destructive/50 text-destructive hover:bg-destructive-background mt-4 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"><FiTrash2 className="mr-2 inline" />Delete account</button></section></div>}
    {activeTab === "notifications" && <section className="border-border bg-surface/75 flex min-h-72 flex-col items-center justify-center rounded-xl border px-5 text-center"><div className="border-border bg-surface-soft flex h-12 w-12 items-center justify-center rounded-xl border"><FiBell className="text-font-secondary h-6 w-6" /></div><h2 className="text-font-primary mt-4 font-serif text-2xl">Notifications are on the way</h2><p className="text-font-muted mt-2 max-w-sm text-sm leading-relaxed">Soon you’ll be able to choose which updates reach you.</p></section>}
    {(notice || error) && <FeedbackToast message={error || notice} error={Boolean(error)} onDismiss={clearFeedback} />}
  </div></div>{cropTarget && <ImageCropDialog file={cropTarget.file} kind={cropTarget.kind} onCancel={() => setCropTarget(null)} onConfirm={saveImage} />}{showDeleteDialog && <ConfirmationDialog title="Confirm account deletion" onClose={() => !deletionBusy && setShowDeleteDialog(false)}><p className="text-font-secondary mt-3 text-sm leading-relaxed">This starts a permanent deletion request. We’ll email a verification link before anything is removed.</p><label className="text-font-secondary mt-4 block text-sm">Current password<Input type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="mt-2" /></label><label className="text-font-secondary mt-4 block text-sm">Type DELETE to continue<Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className="mt-2" /></label><button type="button" onClick={beginAccountDeletion} disabled={deletionBusy} className="border-destructive/50 text-destructive hover:bg-destructive-background mt-5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">{deletionBusy ? "Verifying..." : "Send verification email"}</button></ConfirmationDialog>}{showFinalDeleteDialog && <ConfirmationDialog title="Permanently delete account?" onClose={() => !deletionBusy && setShowFinalDeleteDialog(false)}><p className="text-font-secondary mt-3 text-sm leading-relaxed">Your email and password have been verified. This final action immediately deletes your account and cannot be undone.</p><button type="button" onClick={deleteAccount} disabled={deletionBusy} className="border-destructive/50 text-destructive hover:bg-destructive-background mt-5 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50">{deletionBusy ? "Deleting..." : "Delete account permanently"}</button></ConfirmationDialog>}</section>;
}

export default Settings;
