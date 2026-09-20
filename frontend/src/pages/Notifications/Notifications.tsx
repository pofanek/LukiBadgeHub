import { FiAward, FiBell, FiCheck, FiShield, FiTrash2, FiUserPlus, FiUsers } from "react-icons/fi";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FocusContent, LoadingIndicator } from "../../components";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useNotifications, type AppNotification } from "../../hooks/notificationsContext";

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;
  return new Date(value).toLocaleDateString();
}

function NotificationIcon({ notification }: { notification: AppNotification }) {
  const className = "h-5 w-5";
  if (notification.type === "role_granted") return <FiShield className={className} />;
  if (notification.type === "special_badge_awarded") return <FiAward className={className} />;
  if (notification.type === "new_mutual") return <FiUsers className={className} />;
  return <FiUserPlus className={className} />;
}

function Notifications() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuthUser();
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markRead,
    markAllRead,
    deleteNotification,
    clearRead,
    loadMore,
  } = useNotifications();

  if (isAuthLoading) {
    return <FocusContent><div className="flex min-h-72 items-center justify-center"><LoadingIndicator label="Loading notifications..." /></div></FocusContent>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const openNotification = async (notification: AppNotification) => {
    if (!notification.read_at) await markRead(notification.id, true);
    if (notification.action_path) navigate(notification.action_path);
  };

  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-7 xl:max-w-7xl">
          <header className="border-border flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-font-primary font-serif text-4xl sm:text-5xl">Notifications</h1>
              <p className="text-font-secondary mt-2">Your role, badge, and social updates in one place.</p>
            </div>
            <Link to="/settings?tab=notifications" className="border-border text-font-secondary hover:bg-surface-soft hover:text-font-primary inline-flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm font-medium sm:self-auto">Notification settings</Link>
          </header>

          {isLoading ? <div className="py-16"><LoadingIndicator label="Loading notifications..." /></div> : notifications.length ? <>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {unreadCount > 0 && <button type="button" onClick={() => void markAllRead()} className="border-border text-font-secondary hover:bg-surface-soft hover:text-font-primary rounded-lg border px-3 py-2 text-sm font-medium"><FiCheck className="mr-1.5 inline h-4 w-4" />Mark all as read</button>}
              <button type="button" onClick={() => void clearRead()} className="border-border text-font-secondary hover:bg-surface-soft hover:text-font-primary rounded-lg border px-3 py-2 text-sm font-medium"><FiTrash2 className="mr-1.5 inline h-4 w-4" />Clear read</button>
            </div>
            <ol className="border-border bg-surface/75 mt-3 overflow-hidden rounded-xl border">
              {notifications.map((notification) => <li key={notification.id} className={`border-border flex gap-3 border-b p-3 last:border-b-0 sm:p-4 ${notification.read_at ? "" : "bg-brand-tertiary/25"}`}>
                <span className="text-accent-cold bg-surface-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><NotificationIcon notification={notification} /></span>
                <button type="button" onClick={() => void openNotification(notification)} className="min-w-0 flex-1 text-left"><span className="flex items-center gap-2"><span className="text-font-primary truncate text-sm font-semibold sm:text-base">{notification.title}</span>{!notification.read_at && <span aria-label="Unread" className="bg-accent-cold h-2 w-2 shrink-0 rounded-full" />}</span><span className="text-font-secondary mt-1 block text-sm leading-relaxed">{notification.body}</span><span className="text-font-muted mt-2 block text-xs">{relativeTime(notification.created_at)}</span></button>
                <div className="flex shrink-0 items-start gap-1"><button type="button" onClick={() => void markRead(notification.id, !notification.read_at)} className="text-font-muted hover:bg-surface-soft hover:text-font-primary rounded-lg p-2" aria-label={notification.read_at ? "Mark as unread" : "Mark as read"}><FiCheck className="h-4 w-4" /></button><button type="button" onClick={() => void deleteNotification(notification.id)} className="text-font-muted hover:bg-surface-soft hover:text-destructive rounded-lg p-2" aria-label="Delete notification"><FiTrash2 className="h-4 w-4" /></button></div>
              </li>)}
            </ol>
            {hasMore && <div className="mt-5 text-center"><button type="button" onClick={() => void loadMore()} className="border-border text-font-secondary hover:bg-surface-soft hover:text-font-primary rounded-lg border px-4 py-2.5 text-sm font-medium">Load more</button></div>}
          </> : <div className="border-border bg-surface/75 mt-5 rounded-xl border px-5 py-16 text-center"><div className="border-border bg-surface-soft mx-auto flex h-12 w-12 items-center justify-center rounded-xl border"><FiBell className="text-font-secondary h-6 w-6" /></div><h2 className="text-font-primary mt-4 font-serif text-2xl">You are all caught up</h2><p className="text-font-muted mt-2 text-sm">New roles, special badges, followers, and mutuals will appear here.</p></div>}
        </div>
      </section>
    </FocusContent>
  );
}

export default Notifications;
