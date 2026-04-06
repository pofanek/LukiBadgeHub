type SubmitProps = {
  label?: string;
  cooldown?: number;
  disabled?: any;
  className?: string;
};

const Submit = ({
  label = "Submit",
  cooldown = 0,
  disabled,
  className = "",
}: SubmitProps) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`${className} text-font-primary from-accent-cold to-accent-cold-dim cursor-pointer rounded-xl bg-linear-to-r p-1.5 transition-transform duration-300 hover:scale-[103%] disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {cooldown > 0 ? `Please wait ${cooldown}s` : label}
    </button>
  );
};

export default Submit;
