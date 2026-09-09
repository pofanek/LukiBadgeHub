type LoadingIndicatorProps = {
  label?: string;
};

function LoadingIndicator({ label = "Loading..." }: LoadingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 text-center"
    >
      <div aria-hidden="true" className="relative h-14 w-14">
        <span className="border-border border-t-accent-cold absolute inset-0 animate-spin rounded-full border-2 motion-reduce:animate-none" />
        <span className="border-surface-soft border-b-font-secondary absolute inset-2 animate-[spin_1.4s_linear_infinite_reverse] rounded-full border-2 motion-reduce:animate-none" />
        <span className="bg-accent-cold absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>
      <p className="text-font-secondary">{label}</p>
    </div>
  );
}

export default LoadingIndicator;
