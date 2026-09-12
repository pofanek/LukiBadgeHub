import {
  FiUser,
  FiSettings,
  FiBell,
  FiLogOut,
  FiAward,
  FiCoffee,
} from "react-icons/fi";
import { IoGameControllerOutline } from "react-icons/io5";
import { RiDiscordLine } from "react-icons/ri";
import type { IconType } from "react-icons";

export type MenuItem = {
  label: string;
  pathTo: string;
  isLink?: boolean;
  icon: IconType;
};

export const MENU_SECTIONS: MenuItem[][] = [
  [
    { label: "Games", pathTo: "/games", icon: IoGameControllerOutline },
    { label: "Leaderboards", pathTo: "/rankings", icon: FiAward },
  ],
  [
    { label: "Profile", pathTo: "/profile", icon: FiUser },
    { label: "Notifications", pathTo: "/notifications", icon: FiBell },
    { label: "Settings", pathTo: "/settings", icon: FiSettings },
    { label: "Logout", pathTo: "/logout", icon: FiLogOut },
  ],
  [
    {
      label: "Discord",
      pathTo: "https://discord.gg/UH6eUVQQMX",
      isLink: true,
      icon: RiDiscordLine,
    },
    {
      label: "Support Me!",
      pathTo: "https://ko-fi.com/",
      isLink: true,
      icon: FiCoffee,
    },
  ],
];

export const TOTAL_ITEMS = MENU_SECTIONS.flat().length;
