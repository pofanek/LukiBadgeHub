type TextareaProps = {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
};

const Textarea = ({ message, setMessage }: TextareaProps) => {
  return (
    <textarea
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      className="bg-surface text-font-primary focus-within:ring-brand-secondary max-w-full flex-1 rounded-lg p-2 transition-all duration-100 outline-none focus-within:ring-2"
    />
  );
};

export default Textarea;
