import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Turnstile from "./Turnstile";

describe("Turnstile", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "test-site-key");
    document.head.innerHTML = "";
    delete window.turnstile;
  });

  it("clears the auth token when the challenge expires or errors", () => {
    let options: { callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void } | undefined;
    window.turnstile = {
      render: (_container, nextOptions) => {
        options = nextOptions;
        return "widget-id";
      },
      remove: vi.fn(),
      reset: vi.fn(),
    };
    const onTokenChange = vi.fn();

    render(<Turnstile onTokenChange={onTokenChange} />);

    expect(options).toBeDefined();
    act(() => {
      options?.callback("valid-token");
      options?.["expired-callback"]();
      options?.["error-callback"]();
    });

    expect(onTokenChange).toHaveBeenNthCalledWith(1, "valid-token");
    expect(onTokenChange).toHaveBeenNthCalledWith(2, null);
    expect(onTokenChange).toHaveBeenNthCalledWith(3, null);
    expect(screen.getByRole("status")).toHaveTextContent("could not load");
  });

  it("reports a missing site key without rendering a widget", () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");

    render(<Turnstile onTokenChange={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("could not load");
    expect(document.getElementById("cloudflare-turnstile-script")).toBeNull();
  });
});
