import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const siteName = "Luki Badge Hub";
const canonicalOrigin = "https://www.lukibadgehub.com";

type PageMetadata = {
  description: string;
  title: string;
  noIndex?: boolean;
};

function profileTitle(username: string) {
  try {
    return `${decodeURIComponent(username)} | ${siteName}`;
  } catch {
    return `Profile | ${siteName}`;
  }
}

function getPageMetadata(pathname: string): PageMetadata {
  if (pathname === "/") return { title: siteName, description: "Discover custom game challenges, earn badges and EXP, and climb the Luki Badge Hub leaderboards." };
  if (pathname === "/about") return { title: `About | ${siteName}`, description: "Learn about Luki Badge Hub and its community-built game challenges." };
  if (pathname === "/contact") return { title: `Contact | ${siteName}`, description: "Contact Luki Badge Hub with feedback, bug reports, and feature requests." };
  if (pathname === "/terms") return { title: `Terms & Privacy | ${siteName}`, description: "Read the Luki Badge Hub terms of service and privacy information." };
  if (pathname === "/games") return { title: `Games | ${siteName}`, description: "Browse games, custom badge challenges, difficulty tiers, and EXP rewards." };
  if (/^\/games\/[^/]+\/players$/.test(pathname)) return { title: `Top Players | ${siteName}`, description: "See the top players and earned EXP for this game on Luki Badge Hub." };
  if (/^\/games\/[^/]+$/.test(pathname)) return { title: `Game | ${siteName}`, description: "Explore this game's badge challenges, difficulty tiers, and player progress." };
  if (pathname === "/leaderboard") return { title: `Leaderboards | ${siteName}`, description: "Compare badge collections and earned EXP with the Luki Badge Hub community." };
  if (pathname === "/profile") return { title: `Profile | ${siteName}`, description: "View your Luki Badge Hub profile and game progress.", noIndex: true };
  if (pathname.startsWith("/profile/")) {
    return { title: profileTitle(pathname.slice("/profile/".length)), description: "View this player's Luki Badge Hub profile, game library, and badge progress." };
  }
  if (pathname === "/settings") return { title: `Settings | ${siteName}`, description: "Manage your Luki Badge Hub account and preferences.", noIndex: true };
  if (pathname === "/support") return { title: `Support | ${siteName}`, description: "Support Luki Badge Hub.", noIndex: true };
  if (pathname === "/updates") return { title: `Updates | ${siteName}`, description: "Read the latest Luki Badge Hub updates and improvements." };
  if (pathname === "/search") return { title: `Search | ${siteName}`, description: "Search Luki Badge Hub games, badges, and players.", noIndex: true };
  if (pathname === "/notifications") return { title: `Notifications | ${siteName}`, description: "View your Luki Badge Hub notifications.", noIndex: true };
  if (pathname === "/login") return { title: `Log in | ${siteName}`, description: "Log in to Luki Badge Hub.", noIndex: true };
  if (pathname === "/signup") return { title: `Sign up | ${siteName}`, description: "Create your Luki Badge Hub account.", noIndex: true };
  if (pathname === "/forgot-password") return { title: `Forgot password | ${siteName}`, description: "Reset your Luki Badge Hub password.", noIndex: true };
  if (pathname === "/reset-password") return { title: `Reset password | ${siteName}`, description: "Choose a new Luki Badge Hub password.", noIndex: true };
  if (pathname === "/goodbye") return { title: `Account deleted | ${siteName}`, description: "Your Luki Badge Hub account has been deleted.", noIndex: true };
  if (pathname === "/auth/callback") return { title: `Signing in | ${siteName}`, description: "Completing sign-in.", noIndex: true };
  if (pathname === "/admin") return { title: `Admin | ${siteName}`, description: "Luki Badge Hub administration.", noIndex: true };
  if (pathname.startsWith("/admin/games/")) return { title: `Edit game | ${siteName}`, description: "Edit a Luki Badge Hub game.", noIndex: true };
  return { title: `Page not found | ${siteName}`, description: "This Luki Badge Hub page could not be found.", noIndex: true };
}

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = getPageMetadata(pathname);
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", metadata.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", metadata.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", metadata.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `${canonicalOrigin}${pathname}`);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", metadata.noIndex ? "noindex, nofollow" : "index, follow");
  }, [pathname]);
}
