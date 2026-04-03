import {
  FiUser,
  FiSettings,
  FiCreditCard,
  FiBell,
  FiUsers,
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
    { label: "Games", pathTo: "/Games", icon: IoGameControllerOutline },
    { label: "Rankings", pathTo: "/Rankings", icon: FiAward },
  ],
  [
    { label: "Profile", pathTo: "/Profile", icon: FiUser },
    { label: "Friends", pathTo: "/Friends", icon: FiUsers },
    { label: "Notifications", pathTo: "/Notifications", icon: FiBell },
    { label: "Billing", pathTo: "/Billing", icon: FiCreditCard },
    { label: "Settings", pathTo: "/Settings", icon: FiSettings },
    { label: "Logout", pathTo: "/Logout", icon: FiLogOut },
  ],
  [
    {
      label: "Discord",
      pathTo: "https://discord.gg/UH6eUVQQMX",
      isLink: true,
      icon: RiDiscordLine,
    },
    {
      label: "Support Us!",
      pathTo: "https://ko-fi.com/",
      isLink: true,
      icon: FiCoffee,
    },
  ],
];

export const TOTAL_ITEMS = MENU_SECTIONS.flat().length;
