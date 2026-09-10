import { FiCheck } from "react-icons/fi";
import { passwordRequirements } from "../../utils/password";

function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="text-font-muted mt-2 grid gap-1 text-xs" aria-live="polite">
      {passwordRequirements.map(({ label, passes }) => {
        const isMet = passes(password);
        return <li key={label} className={`flex items-center gap-1.5 ${isMet ? "text-font-secondary" : ""}`}><FiCheck className={isMet ? "text-accent-cold" : "text-font-muted-2"} />{label}</li>;
      })}
    </ul>
  );
}

export default PasswordRequirements;
