import type React from "react";

type props = {
  children: React.ReactNode;
};
const Card = ({ children }: props) => {
  return (
    <div className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-145 max-w-110 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 shadow-black outline-none">
      {children}
    </div>
  );
};

export default Card;
