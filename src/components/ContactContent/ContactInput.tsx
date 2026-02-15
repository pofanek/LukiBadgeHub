const InputWithIcon = () => {
  return (
    <input
      type="text"
      className={`text-font-primary bg-surface hover:ring-brand-secondary focus-within:ring-brand-secondary max-w-full flex-1 rounded-2xl bg-linear-to-r p-1.5 px-4 text-xl transition-all duration-200 outline-none focus-within:ring-2 hover:ring-2 lg:max-w-[80%]`}
    />
  );
};

export default InputWithIcon;
