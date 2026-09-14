import { useId, useState } from "react";
import {
  FaCrown,
  FaHeart,
  FaShield,
  FaUser,
  FaUserShield,
} from "react-icons/fa6";
import type { UserRole } from "../../hooks/useUserProfile";

type RoleBadgeProps = {
  role: UserRole;
};

const roleDetails = {
  User: { icon: FaUser, className: "text-accent-cold" },
  Supporter: { icon: FaHeart, className: "text-accent-cold" },
  Moderator: { icon: FaShield, className: "text-accent-cold" },
  Admin: { icon: FaUserShield, className: "text-accent-cold" },
  Owner: { icon: FaCrown, className: "text-accent-cold" },
} satisfies Record<UserRole, { icon: typeof FaUser; className: string }>;

function RoleBadge({ role }: RoleBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const { icon: Icon, className } = roleDetails[role];

  return (
    <span
      className="group relative inline-flex shrink-0"
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") setIsOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={`${role} role`}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`${className} hover:text-hover focus-visible:ring-accent-cold inline-flex rounded-sm p-0.5 transition-colors outline-none focus-visible:ring-2`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`border-border bg-surface text-font-primary pointer-events-none absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-black transition-opacity ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {role}
      </span>
    </span>
  );
}

export default RoleBadge;
