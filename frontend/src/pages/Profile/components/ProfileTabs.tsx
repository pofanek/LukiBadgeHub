import type { ProfileTab } from "../Profile";

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
};

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "games", label: "Games" },
  { id: "mutuals", label: "Mutuals" },
  { id: "stats", label: "Stats" },
  { id: "recents", label: "Recents" },
];

function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <nav aria-label="Profile sections" className="overflow-x-auto">
      <div className="flex min-w-max px-2 sm:min-w-0 sm:px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative flex-1 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors sm:text-base ${
                isActive
                  ? "text-font-primary"
                  : "text-font-muted hover:text-font-secondary"
              }`}
            >
              {tab.label}
              <span
                className={`bg-accent-cold absolute right-5 bottom-0 left-5 h-0.5 origin-center transition-transform ${
                  isActive ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default ProfileTabs;
