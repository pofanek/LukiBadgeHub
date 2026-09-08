const activities = [
  ["Cell to Singularity", "Cosmic Pioneer", "Extreme", "Completed a difficult evolutionary milestone."],
  ["Hades", "River Styx", "Hard", "Escaped the Underworld with a new weapon aspect."],
  ["Stardew Valley", "Golden Hoe", "Medium", "Finished a seasonal collection."],
  ["Hollow Knight", "Dreamer", "El Diablo", "Defeated a hidden challenger."],
];
function RecentsPanel() { return <div className="space-y-3">{activities.map(([game, badge, difficulty, description]) => <article key={badge} className="border-border bg-surface/75 grid gap-3 rounded-xl border p-3 sm:grid-cols-[12rem_3.75rem_minmax(0,1fr)] sm:items-center"><div className="from-brand-tertiary to-surface-overlay border-border flex h-20 items-end rounded-lg border bg-linear-to-br p-2"><span className="text-font-primary font-serif text-sm">{game}</span></div><div className="border-border bg-surface-soft flex h-14 w-14 items-center justify-center rounded-lg border"><span className="bg-accent-cold h-8 w-8 rounded-md" /></div><div><div className="flex flex-wrap items-baseline gap-x-2"><h2 className="text-font-primary font-medium">{badge}</h2><span className="text-font-secondary text-sm">{game}</span></div><p className="text-font-secondary mt-1 flex items-center gap-2 text-xs"><span className="bg-accent-cold h-2.5 w-2.5 rounded-sm" />{difficulty}</p><p className="text-font-muted mt-1 text-sm">{description}</p></div></article>)}</div>; }
export default RecentsPanel;
