import type { NavigateFunction } from "react-router-dom";

type ErrorPageButtonsProps = {
  navigate: NavigateFunction;
};

const ErrorPageButtons = ({ navigate }: ErrorPageButtonsProps) => {
  return (
    <div className="flex w-[80%] min-w-64 flex-col gap-3">
      <button
        onClick={() => navigate("/")}
        className="bg-surface text-font-primary from-accent-cold to-accent-cold-dim w-full cursor-pointer rounded-xl bg-linear-to-r p-2 font-sans text-lg transition-transform duration-300 hover:scale-[103%]"
      >
        Go home
      </button>
      <button
        onClick={() => navigate(-1)}
        className="border-surface-soft hover:ring-surface-raised text-font-secondary w-full cursor-pointer rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 hover:ring-2"
      >
        Go back
      </button>
    </div>
  );
};

export default ErrorPageButtons;
