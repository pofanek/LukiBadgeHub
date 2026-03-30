import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <main className="flex h-full w-full flex-1 items-center justify-center">
      <div className="bg-surface-overlay/40 mx-20 mt-15 mb-15 flex h-155 max-w-120 min-w-85 flex-1 flex-col items-center justify-center gap-6 rounded-xl px-5 py-16 shadow-black">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-accent-cold font-fenix text-8xl font-bold">
            404
          </h1>
          <h2 className="text-font-primary font-serif text-3xl">
            Page not found
          </h2>
          <p className="text-font-muted mt-2 text-center font-sans text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="border-surface-soft w-[80%] border-t" />
        <div className="flex w-[80%] min-w-64 flex-col gap-3">
          <button
            onClick={() => navigate("/")}
            className="bg-surface text-font-primary from-accent-cold to-accent-cold-dim w-full cursor-pointer rounded-xl bg-linear-to-r p-2 font-sans text-lg transition-transform duration-300 hover:scale-[103%]"
          >
            Go home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="border-surface-soft hover:ring-surface-raised text-font-secondary w-full cursor-pointer rounded-xl border-2 p-2 font-sans text-lg transition-all duration-200 hover:ring-2"
          >
            Go back
          </button>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;
