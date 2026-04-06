import type React from "react";

type props = {
  children: React.ReactNode;
};

const FormFooter = ({ children }: props) => {
  return (
    <div className="flex w-full flex-col items-center gap-3.5">{children}</div>
  );
};

export default FormFooter;
