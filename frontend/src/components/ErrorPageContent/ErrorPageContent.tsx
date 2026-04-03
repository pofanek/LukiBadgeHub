import { useNavigate } from "react-router-dom";
import { ErrorPageButtons } from "./";
import { ErrorPageInfo } from "./";

const ErrorPageContent = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-155 max-w-120 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 py-16 shadow-black">
      <ErrorPageInfo />
      <div className="border-surface-soft w-[80%] border-t" />
      <ErrorPageButtons navigate={navigate} />
    </div>
  );
};

export default ErrorPageContent;
