import { FiGlobe } from "react-icons/fi";
import type { CountryOption } from "../constants/countries";

type CountryFlagProps = {
  country: CountryOption;
  className?: string;
};

function CountryFlag({ country, className = "" }: CountryFlagProps) {
  if (country.code === "unknown") {
    return (
      <span
        aria-label="Country not set"
        title="Country not set"
        className={`border-border bg-surface-raised text-font-secondary inline-flex h-4 w-5 shrink-0 items-center justify-center rounded-sm border ${className}`}
      >
        <FiGlobe className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span
      aria-label={country.name}
      role="img"
      title={country.name}
      className={`fi fi-${country.code.toLowerCase()} inline-block h-3.5 w-5 shrink-0 ${className}`}
    />
  );
}

export default CountryFlag;
