const ErrorPageInfo = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="text-accent-cold font-fenix text-8xl font-bold">404</h1>
      <h2 className="text-font-primary font-serif text-3xl">Page not found</h2>
      <p className="text-font-muted mt-2 text-center font-sans text-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
  );
};

export default ErrorPageInfo;
