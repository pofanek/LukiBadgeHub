import { userchomik } from "../../assets";

const ProfileUserInfo = () => {
  const name = "Pofanek";
  const email = "pofanek@mail.com";
  const plan = "Free";

  return (
    <li className="flex flex-col gap-2 px-2 py-2.5">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={userchomik}
            alt="avatar"
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

      <div className="mt-1 flex items-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/25">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {plan} plan
        </span>
      </div>
    </li>
  );
};

export default ProfileUserInfo;
