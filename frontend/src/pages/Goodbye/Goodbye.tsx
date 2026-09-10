import { Link } from "react-router-dom";
import { FocusContent } from "../../components";

function Goodbye() {
  return <FocusContent><section className="border-border bg-surface-overlay/70 w-full max-w-lg rounded-xl border p-8 text-center shadow-black"><h1 className="text-font-primary font-serif text-4xl">Account deleted</h1><p className="text-font-secondary mt-3 leading-relaxed">Your account and its profile data have been permanently removed.</p><Link to="/" className="bg-brand-secondary text-font-primary hover:bg-brand-primary mt-6 inline-block rounded-lg px-4 py-2 text-sm font-medium">Return home</Link></section></FocusContent>;
}

export default Goodbye;
