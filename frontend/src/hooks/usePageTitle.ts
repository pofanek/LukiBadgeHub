import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteName = "Luki Badge Hub";

function profileTitle(username: string) {
  try {
    return `${decodeURIComponent(username)} | ${siteName}`;
  } catch {
    return `Profile | ${siteName}`;
  }
}

function getPageTitle(pathname: string) {
  if (pathname === "/") return siteName;
  if (pathname === "/about") return `About | ${siteName}`;
  if (pathname === "/contact") return `Contact | ${siteName}`;
  if (pathname === "/terms") return `Terms & Privacy | ${siteName}`;
  if (pathname === "/games") return `Games | ${siteName}`;
  if (/^\/games\/[^/]+$/.test(pathname)) return `Game | ${siteName}`;
  if (pathname === "/rankings") return `Leaderboards | ${siteName}`;
  if (pathname === "/profile") return `Profile | ${siteName}`;
  if (pathname.startsWith("/profile/")) {
    return profileTitle(pathname.slice("/profile/".length));
  }
  if (pathname === "/settings") return `Settings | ${siteName}`;
  if (pathname === "/billing") return `Billing | ${siteName}`;
  if (pathname === "/notifications") return `Notifications | ${siteName}`;
  if (pathname === "/login") return `Log in | ${siteName}`;
  if (pathname === "/signup") return `Sign up | ${siteName}`;
  if (pathname === "/forgot-password") return `Forgot password | ${siteName}`;
  if (pathname === "/reset-password") return `Reset password | ${siteName}`;
  if (pathname === "/goodbye") return `Account deleted | ${siteName}`;
  if (pathname === "/auth/callback") return `Signing in | ${siteName}`;
  if (pathname === "/admin") return `Admin | ${siteName}`;
  if (pathname.startsWith("/admin/games/")) return `Edit game | ${siteName}`;
  return `Page not found | ${siteName}`;
}

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname);
  }, [pathname]);
}
