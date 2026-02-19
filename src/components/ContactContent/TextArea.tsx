type TextareaProps = {
  message: string;
  id: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
};

const Textarea = ({ message, setMessage, id }: TextareaProps) => {
  return (
    <textarea
      required
      id={id}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Your message here..."
      className="bg-surface text-font-primary text-md focus-within:ring-brand-secondary max-w-full flex-1 rounded-lg p-2 transition-all duration-100 outline-none focus-within:ring-2"
    />
  );
};

export default Textarea;
