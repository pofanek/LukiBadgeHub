import { FiClock } from "react-icons/fi";
import { FocusContent } from "../../components";
import { projectUpdates, type ProjectUpdate } from "../../constants";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatUpdateDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

function UpdateCard({ update }: { update: ProjectUpdate }) {
  return (
    <article className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-accent-cold font-medium">{update.type}</span>
        <time className="text-font-muted" dateTime={update.date}>
          {formatUpdateDate(update.date)}
        </time>
      </div>
      <h2 className="text-font-primary mt-3 font-serif text-2xl">
        {update.title}
      </h2>
      <p className="text-font-secondary mt-2 max-w-3xl leading-relaxed">
        {update.summary}
      </p>
    </article>
  );
}

function Updates() {
  const updates = [...projectUpdates].sort((left, right) =>
    right.date.localeCompare(left.date),
  );

  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-7 lg:px-10">
          <header className="border-border border-b pb-6">
            <div className="text-accent-cold flex items-center gap-2 text-sm font-medium">
              <FiClock className="h-4 w-4" />
              Updates
            </div>
            <h1 className="text-font-primary mt-2 font-serif text-4xl sm:text-5xl">
              What’s changed
            </h1>
            <p className="text-font-secondary mt-3 max-w-2xl leading-relaxed">
              Balance adjustments, new releases, and improvements to Luki Badge Hub.
            </p>
          </header>

          {updates.length ? (
            <div className="mt-7 space-y-4">
              {updates.map((update) => (
                <UpdateCard key={`${update.date}-${update.title}`} update={update} />
              ))}
            </div>
          ) : (
            <div className="border-border bg-surface/75 mt-7 rounded-xl border p-6 text-center">
              <p className="text-font-secondary">No updates have been published yet.</p>
            </div>
          )}
        </div>
      </section>
    </FocusContent>
  );
}

export default Updates;
