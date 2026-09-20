import { FaDiscord } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { DISCORD_URL } from "../constants";

type CatalogueContributionCalloutProps = {
  variant?: "full" | "compact";
  className?: string;
};

function CatalogueContributionCallout({
  variant = "full",
  className = "",
}: CatalogueContributionCalloutProps) {
  const isCompact = variant === "compact";

  return (
    <section
      className={`border-border bg-surface/75 flex flex-col gap-4 rounded-xl border ${isCompact ? "p-4 sm:flex-row sm:items-center sm:justify-between" : "p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"} ${className}`}
    >
      <div className="flex min-w-0 gap-3">
        <div className="border-accent-cold/40 bg-brand-tertiary text-accent-cold flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
          {isCompact ? <FiPlus className="h-5 w-5" /> : <FaDiscord className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h2
            className={`text-font-primary font-serif ${isCompact ? "text-xl" : "text-2xl"}`}
          >
            Can&apos;t find your game?
          </h2>
          <p className="text-font-secondary mt-1 max-w-2xl text-sm leading-relaxed">
            Join our Discord to suggest it. Want to help build its badges and
            achievements? Let us know there too.
          </p>
        </div>
      </div>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noreferrer"
        className="border-border bg-brand-secondary text-font-primary hover:bg-brand-primary focus-visible:outline-accent-cold inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FaDiscord className="h-4 w-4" />
        Suggest a game on Discord
      </a>
    </section>
  );
}

export default CatalogueContributionCallout;
