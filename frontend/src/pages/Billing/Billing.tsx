import { FiHeart } from "react-icons/fi";
import { FocusContent } from "../../components";
import { DONATION_URL } from "../../constants";

function Support() {
  return (
    <FocusContent>
      <section className="w-full self-stretch py-8 sm:py-10 lg:py-12">
        <div className="mx-auto w-full max-w-2xl px-3 sm:px-7">
          <div className="border-border bg-surface/75 rounded-xl border p-6 text-center sm:p-8">
            <FiHeart className="text-accent-cold mx-auto h-7 w-7" />
            <h1 className="text-font-primary mt-4 font-serif text-3xl sm:text-4xl">
              Support Luki Badge Hub
            </h1>
            <p className="text-font-secondary mx-auto mt-3 max-w-xl leading-relaxed">
              Help cover development and keep the project growing. As a thank-you,
              you’ll receive the Supporter badge on your profile.
            </p>
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noreferrer"
              className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Support the project
            </a>
          </div>
        </div>
      </section>
    </FocusContent>
  );
}

export default Support;
