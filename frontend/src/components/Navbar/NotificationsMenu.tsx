import { useEffect, useRef, useState } from "react";
import { FiAward, FiBell, FiSettings, FiShield, FiUserPlus, FiUsers } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications, type AppNotification } from "../../hooks/useNotifications";

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;
  return new Date(value).toLocaleDateString();
}

function NotificationIcon({ notification }: { notification: AppNotification }) {
  const className = "h-4 w-4";
  if (notification.type === "role_granted") return <FiShield className={className} />;
  if (notification.type === "special_badge_awarded") return <FiAward className={className} />;
  if (notification.type === "new_mutual") return <FiUsers className={className} />;
  return <FiUserPlus className={className} />;
}

function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead } = useNotifications();
  const recentNotifications = notifications.slice(0, 4);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openNotification = async (notification: AppNotification) => {
    if (!notification.read_at) await markRead(notification.id, true);
    setIsOpen(false);
    if (notification.action_path) navigate(notification.action_path);
  };

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="text-font-secondary hover:bg-effect-glass hover:text-font-primary focus-visible:ring-accent-cold relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:ring-2"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && <span aria-hidden="true" className="bg-accent-cold absolute top-2 right-2 h-2 w-2 rounded-full ring-2 ring-surface-overlay" />}
      </button>
      {isOpen && (
        <div role="menu" aria-label="Notifications" className="border-border bg-surface absolute top-[calc(100%+0.6rem)] right-0 z-50 w-[22rem] overflow-hidden rounded-xl border shadow-black">
          <div className="border-border flex items-center justify-between border-b px-4 py-3">
            <p className="text-font-primary font-serif text-xl">Notifications</p>
            {unreadCount > 0 && <span className="text-accent-cold text-xs font-medium">{unreadCount} new</span>}
          </div>
          {recentNotifications.length ? (
            <div className="max-h-[22rem] overflow-y-auto p-1.5">
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  role="menuitem"
                  onClick={() => void openNotification(notification)}
                  className={`flex w-full gap-3 rounded-lg p-2.5 text-left transition-colors ${notification.read_at ? "text-font-secondary hover:bg-surface-soft" : "bg-brand-tertiary/45 text-font-primary hover:bg-brand-tertiary"}`}
                >
                  <span className="text-accent-cold bg-surface-soft mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <NotificationIcon notification={notification} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">{notification.title}</span>
                      {!notification.read_at && <span className="bg-accent-cold h-1.5 w-1.5 shrink-0 rounded-full" />}
                    </span>
                    <span className="text-font-muted mt-0.5 block truncate text-xs">{notification.body}</span>
                    <span className="text-font-muted-2 mt-1 block text-xs">{relativeTime(notification.created_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <FiBell className="text-font-muted mx-auto h-5 w-5" />
              <p className="text-font-secondary mt-2 text-sm">You are all caught up.</p>
            </div>
          )}
          <div className="border-border grid grid-cols-2 border-t p-1.5">
            <Link to="/notifications" onClick={() => setIsOpen(false)} role="menuitem" className="text-font-secondary hover:bg-surface-soft hover:text-font-primary rounded-lg px-3 py-2 text-center text-sm font-medium">View all</Link>
            <Link to="/settings?tab=notifications" onClick={() => setIsOpen(false)} role="menuitem" className="text-font-secondary hover:bg-surface-soft hover:text-font-primary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"><FiSettings className="h-4 w-4" />Settings</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;
