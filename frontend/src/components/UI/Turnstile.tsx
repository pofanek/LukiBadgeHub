import { useEffect, useRef, useState } from "react";

type TurnstileWidget = {
  remove: (widgetId: string) => void;
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

type TurnstileProps = {
  onTokenChange: (token: string | null) => void;
};

const scriptId = "cloudflare-turnstile-script";

function Turnstile({ onTokenChange }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !container.current) return;

    const renderWidget = () => {
      if (!window.turnstile || !container.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token) => onTokenChange(token),
        "expired-callback": () => onTokenChange(null),
        "error-callback": () => {
          onTokenChange(null);
          setLoadError(true);
        },
      });
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    const script = existingScript || document.createElement("script");
    const handleLoad = () => renderWidget();
    const handleError = () => {
      onTokenChange(null);
      setLoadError(true);
    };

    if (!existingScript) {
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    if (window.turnstile) renderWidget();

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [onTokenChange, siteKey]);

  return <div className="flex w-[80%] min-w-64 flex-col items-center gap-2"><div ref={container} /><p className="text-font-muted text-center text-xs" role="status">{loadError || !siteKey ? "Security check could not load. Refresh the page and try again." : "Complete the security check to continue."}</p></div>;
}

export default Turnstile;
