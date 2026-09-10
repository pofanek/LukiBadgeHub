import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiGlobe, FiSearch } from "react-icons/fi";
import { countries, type CountryOption } from "../../../constants/countries";

type CountrySelectProps = {
  value: string;
  onChange: (countryCode: string) => void;
};

function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedCountry = countries.find((country) => country.code === value) || countries[0];
  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return countries;
    return countries.filter((country) => country.name.toLowerCase().includes(normalizedQuery) || country.code.toLowerCase().includes(normalizedQuery));
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    searchRef.current?.focus();
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const selectCountry = (country: CountryOption) => {
    onChange(country.code);
    setQuery("");
    setIsOpen(false);
  };

  return <div ref={containerRef} className="relative mt-2">
    <button type="button" onClick={() => setIsOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={isOpen} className={`border-border bg-surface-soft text-font-primary focus:border-accent-cold flex w-full items-center gap-3 rounded-lg border py-2.5 pr-3 pl-3 text-left text-sm outline-none ${isOpen ? "border-accent-cold" : ""}`}>
      <FiGlobe className="text-font-muted h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{selectedCountry.flag && `${selectedCountry.flag} `}{selectedCountry.name}</span>
      <FiChevronDown className={`text-font-muted h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && <div className="border-border bg-surface absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border shadow-black">
      <div className="border-border border-b p-2"><div className="border-border bg-surface-soft focus-within:border-accent-cold flex items-center gap-2 rounded-lg border px-2.5"><FiSearch className="text-font-muted h-4 w-4 shrink-0" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && filteredCountries.length === 1) selectCountry(filteredCountries[0]); }} className="text-font-primary placeholder:text-font-muted min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" placeholder="Search countries" aria-label="Search countries" /></div></div>
      <ul role="listbox" aria-label="Countries" className="max-h-60 overflow-y-auto p-1.5">
        {filteredCountries.length ? filteredCountries.map((country) => <li key={country.code}><button type="button" role="option" aria-selected={country.code === value} onClick={() => selectCountry(country)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${country.code === value ? "bg-brand-tertiary text-font-primary" : "text-font-secondary hover:bg-surface-soft hover:text-font-primary"}`}><span className="w-5 text-center">{country.flag}</span><span className="min-w-0 flex-1 truncate">{country.name}</span>{country.code === value && <FiCheck className="h-4 w-4 shrink-0" />}</button></li>) : <li className="text-font-muted px-2.5 py-4 text-center text-sm">No countries found.</li>}
      </ul>
    </div>}
  </div>;
}

export default CountrySelect;
