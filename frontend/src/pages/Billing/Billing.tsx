import { useState } from "react";
import { createPortal } from "react-dom";
import { FiHeart, FiX } from "react-icons/fi";
import { FocusContent } from "../../components";

function Support() {
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
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
            <button
              type="button"
              onClick={() => setIsChoiceOpen(true)}
              className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Support the project
            </button>
          </div>
        </div>
      </section>
      {isChoiceOpen && <SupportChoiceDialog onClose={() => setIsChoiceOpen(false)} />}
    </FocusContent>
  );
}

function SupportChoiceDialog({ onClose }: { onClose: () => void }) {
  return createPortal(<div className="bg-surface-overlay/85 fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onClick={onClose}><section role="dialog" aria-modal="true" aria-labelledby="support-choice-title" onClick={(event) => event.stopPropagation()} className="border-border bg-surface w-full max-w-md rounded-xl border p-5 shadow-black sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="support-choice-title" className="text-font-primary font-serif text-2xl">Where are you supporting from?</h2><p className="text-font-secondary mt-2 text-sm leading-relaxed">Choose the payment option that is right for you.</p></div><button type="button" onClick={onClose} aria-label="Close support options" className="text-font-muted hover:text-font-primary rounded p-1"><FiX className="h-5 w-5" /></button></div><div className="mt-5 grid gap-3"><a href="https://buycoffee.to/pofanek" target="_blank" rel="noreferrer" className="bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-lg px-4 py-3 text-center text-sm font-medium">I’m from Poland</a><a href="https://ko-fi.com/pofanek" target="_blank" rel="noreferrer" className="border-border text-font-primary hover:bg-effect-glass rounded-lg border px-4 py-3 text-center text-sm font-medium">I’m not from Poland</a></div></section></div>, document.body);
}

export default Support;
