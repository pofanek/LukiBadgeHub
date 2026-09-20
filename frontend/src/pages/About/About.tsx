import { FaDiscord } from "react-icons/fa";
import {
  FiArrowRight,
  FiAward,
  FiHeart,
  FiLayers,
  FiMonitor,
  FiTrendingUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { FocusContent } from "../../components";
import { DISCORD_URL } from "../../constants";

const features = [
  [FiMonitor, "Rediscover games", "Return to games you already love with something new to do."],
  [FiAward, "Take on challenges", "Choose extra goals that make each playthrough more interesting."],
  [FiTrendingUp, "Track your progress", "Turn completed challenges into badges and visible profile progress."],
  [FiLayers, "Try modded challenges", "Play challenges that may never be part of the original game."],
] as const;

function About() {
  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-7">
          <div className="border-border bg-surface/75 overflow-hidden rounded-xl border">
            <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.55fr)]">
              <div className="p-6 sm:p-8 lg:p-10">
                <h1 className="text-font-primary max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
                  About Luki Badge Hub
                </h1>
                <p className="text-font-secondary mt-4 max-w-2xl leading-relaxed">
                  Luki Badge Hub gives you new ways to enjoy the games you love.
                  Find badges and challenges for a first playthrough or a game you
                  have already completed.
                </p>
              </div>
              <aside className="border-border bg-surface-soft/50 border-t p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
                <p className="text-font-muted text-sm">Created by</p>
                <p className="text-font-primary mt-1 font-serif text-2xl">Pofanek</p>
                <p className="text-font-secondary mt-4 text-sm leading-relaxed">
                  Inspired by my friend Luki, who gave Luki Badge Hub its name.
                </p>
              </aside>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
            <section>
              <h2 className="text-font-primary font-serif text-3xl">Why Luki Badge Hub exists</h2>
              <p className="text-font-secondary mt-3 max-w-xl leading-relaxed">
                The idea came from my friend Luki, which is why the site is called
                Luki Badge Hub. I created it to give players fresh challenges in
                games they already enjoy.
              </p>
              <p className="text-font-secondary mt-3 max-w-xl leading-relaxed">
                Some challenges can require game mods, so they might never appear
                as official content. They are there for players who want more from
                a favourite game, never as a requirement.
              </p>
            </section>

            <section>
              <h2 className="text-font-primary font-serif text-3xl">What you can do here</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {features.map(([Icon, title, description]) => (
                  <article key={title} className="border-border bg-surface/75 rounded-xl border p-4">
                    <Icon className="text-accent-cold h-6 w-6" />
                    <h3 className="text-font-primary mt-3 font-medium">{title}</h3>
                    <p className="text-font-muted mt-1 text-sm leading-relaxed">{description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="border-border bg-surface/75 mt-8 rounded-xl border p-5 sm:p-6">
            <h2 className="text-font-primary font-serif text-2xl">Still growing</h2>
            <p className="text-font-secondary mt-2 max-w-2xl text-sm leading-relaxed">
              New games, badges, balance changes, and profile improvements are
              added over time. Can&apos;t find your game?{" "}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                className="text-accent-cold hover:text-hover underline"
              >
                Suggest it on Discord and help create its badges.
              </a>
            </p>
            <Link
              to="/updates"
              className="text-accent-cold hover:text-hover focus-visible:outline-accent-cold mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-3"
            >
              View updates
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="border-border bg-surface/75 mt-3 flex flex-col gap-5 rounded-xl border p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <FiHeart className="text-accent-cold h-5 w-5" />
                <h2 className="text-font-primary font-serif text-2xl">Support the project</h2>
              </div>
              <p className="text-font-secondary mt-2 text-sm leading-relaxed">
                Help Luki Badge Hub keep growing, or join the community on Discord.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/support"
                className="bg-brand-secondary text-font-primary hover:bg-brand-primary focus-visible:outline-accent-cold inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3"
              >
                <FiHeart className="h-4 w-4" />
                Support me
              </Link>
              <a
                href="https://discord.gg/UH6eUVQQMX"
                target="_blank"
                rel="noreferrer"
                className="border-border text-font-primary hover:bg-effect-glass focus-visible:outline-accent-cold inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-3"
              >
                <FaDiscord className="h-4 w-4" />
                Join Discord
              </a>
            </div>
          </section>
        </div>
      </section>
    </FocusContent>
  );
}

export default About;
