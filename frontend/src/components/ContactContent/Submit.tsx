type SubmitProps = {
  cooldown: number;
};

const Submit = ({ cooldown }: SubmitProps) => {
  return (
    <button
      type="submit"
      disabled={cooldown > 0}
      className="bg-surface text-font-primary from-accent-cold to-accent-cold-dim cursor-pointer rounded-xl bg-linear-to-r p-1.5 transition-transform duration-300 hover:scale-[103%] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {cooldown > 0 ? `Please wait ${cooldown}s` : "Submit"}
    </button>
  );
};

export default Submit;
