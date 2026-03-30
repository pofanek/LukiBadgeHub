type SocialLoginProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

const SocialLogin = ({ icon, label, onClick }: SocialLoginProps) => {
  return (
    <button
      onClick={onClick}
      className="border-surface-soft hover:ring-surface-raised text-font-primary flex w-[80%] min-w-64 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 px-4 py-2 transition-all duration-200 hover:ring-2"
    >
      {icon}
      <span className="font-sans">{label}</span>
    </button>
  );
};

export default SocialLogin;
