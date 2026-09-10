import { userchomik } from "../../assets";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "../../hooks/useUserProfile";

type ProfileUserInfoProps = {
  user: User;
  profile: UserProfile | null;
};

const ProfileUserInfo = ({ user, profile }: ProfileUserInfoProps) => {
  const name = profile?.username || user.email?.split("@")[0] || "User";
  const email = user.email || "";

  return (
    <li className="flex flex-col gap-2 px-2 py-2.5">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={profile?.avatar_url || user.user_metadata.avatar_url || userchomik}
            alt={`${name}'s avatar`}
            className="h-11 w-11 rounded-full object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-font-primary truncate text-sm font-semibold">
            {name}
          </span>
          <span className="text-font-secondary truncate text-xs">{email}</span>
        </div>
      </div>

      
    </li>
  );
};

export default ProfileUserInfo;
