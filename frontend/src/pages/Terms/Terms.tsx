import { FocusContent } from "../../components";

function Terms() {
  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-7 xl:max-w-7xl">
          <header className="border-border border-b pb-6 sm:pb-8">
            <h1 className="text-font-primary font-serif text-4xl sm:text-5xl">
              Terms &amp; Privacy
            </h1>
            <p className="text-font-muted mt-2 text-sm">
              Last updated: 14 September 2026
            </p>
          </header>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
              <h2 className="text-font-primary font-serif text-2xl">
                Terms of use
              </h2>
              <div className="text-font-secondary mt-3 space-y-3 text-sm leading-relaxed">
                <p>
                  Use Luki Badge Hub respectfully and lawfully. Do not impersonate
                  others, disrupt the service, or upload content you do not have
                  permission to use.
                </p>
                <p>
                  Badge verification and moderation decisions are made by the
                  project team. We may remove content, restrict accounts, or change
                  the service to protect the community.
                </p>
                <p>
                  By uploading content, you grant us a non-exclusive licence to
                  store, process, and display it only as necessary to operate the
                  Website.
                </p>
                <p>
                  The Website is provided on an &quot;as available&quot; basis. We cannot
                  guarantee that it will always be uninterrupted or that every
                  challenge is suitable for every player.
                </p>
              </div>
            </section>

            <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
              <h2 className="text-font-primary font-serif text-2xl">Privacy</h2>
              <div className="text-font-secondary mt-3 space-y-3 text-sm leading-relaxed">
                <p>
                  The data controller is Pofanek, operator of Luki Badge Hub. For
                  privacy requests, email{" "}
                  <a
                    href="mailto:pofanekk@gmail.com"
                    className="text-accent-cold hover:text-hover font-medium"
                  >
                    pofanekk@gmail.com
                  </a>
                  .
                </p>
                <p>
                  We process your email and sign-in identity, username, optional
                  profile details and media, game progress, follows, notifications,
                  contact-form messages, and any verification evidence you choose to
                  submit.
                </p>
                <p>
                  We use this data to run accounts and community features, provide
                  support, prevent abuse, and review badges. We rely on providing
                  the service, legitimate community and security interests, and your
                  choices for optional public profile content.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
              <h2 className="text-font-primary font-serif text-2xl">Accounts</h2>
              <p className="text-font-secondary mt-3 text-sm leading-relaxed">
                You are responsible for keeping your account secure. You must not
                create accounts to evade restrictions or abuse Website features.
              </p>
            </section>

            <section className="border-border bg-surface/75 rounded-xl border p-5 sm:p-6">
              <h2 className="text-font-primary font-serif text-2xl">
                Account termination
              </h2>
              <p className="text-font-secondary mt-3 text-sm leading-relaxed">
                We may suspend or terminate accounts that violate these Terms. You
                may request deletion of your account at any time.
              </p>
            </section>
          </div>

          <section className="border-border bg-surface/75 mt-4 rounded-xl border p-5 sm:p-6">
            <h2 className="text-font-primary font-serif text-2xl">Data handling</h2>
            <div className="text-font-secondary mt-3 space-y-3 text-sm leading-relaxed">
              <p>
                We use Supabase for authentication and database services, Cloudflare
                R2 for media, Vercel for hosting, Google and Discord for optional
                sign-in, Discord for contact and verification tickets, and Ko-fi for
                optional support payments. Their own privacy policies also apply,
                and they may process data outside your country.
              </p>
              <p>
                We do not use advertising or analytics. Essential sign-in storage is
                used to keep your account session active. Account data is kept until
                you delete your account; contact-form messages are kept until the
                matter is resolved.
              </p>
              <p>
                You can request access, correction, deletion, restriction, or a copy
                of your data using the email above. You may also complain to your
                local data-protection authority. Policy updates will appear here.
              </p>
            </div>
          </section>
        </div>
      </section>
    </FocusContent>
  );
}

export default Terms;
