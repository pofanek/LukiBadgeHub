import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Contact from "./Contact";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("../../utils/supabase", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

vi.mock("../../components/UI", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../components/UI")>();
  return {
    ...actual,
    Turnstile: ({ onTokenChange }: { onTokenChange: (token: string | null) => void }) => (
      <button type="button" onClick={() => onTokenChange("captcha-token")}>
        Complete security check
      </button>
    ),
  };
});

describe("Contact", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("requires Turnstile and sends the validated form to the server function", async () => {
    mocks.invoke.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>,
    );

    const submit = screen.getByRole("button", { name: "Submit" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText("john.doe@example.com"), "player@example.com");
    await user.type(screen.getByPlaceholderText("Your message here..."), "Great game!");
    await user.click(screen.getByRole("button", { name: "Complete security check" }));
    await user.click(submit);

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith("feedback", {
        body: {
          captchaToken: "captcha-token",
          email: "player@example.com",
          message: "Great game!",
          name: "",
          topic: "Feedback",
        },
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Thanks — your message has been sent.");
    expect(screen.getByPlaceholderText("Your message here...")).toHaveValue("");
  });

  it("shows the server's safe response error and permits a retry", async () => {
    mocks.invoke.mockResolvedValue({
      error: { context: new Response(JSON.stringify({ error: "Too many messages. Try again in a few minutes." })) },
    });
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Contact />
      </BrowserRouter>,
    );

    await user.type(screen.getByPlaceholderText("john.doe@example.com"), "player@example.com");
    await user.type(screen.getByPlaceholderText("Your message here..."), "Great game!");
    await user.click(screen.getByRole("button", { name: "Complete security check" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Too many messages. Try again in a few minutes.");
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    expect(screen.getByPlaceholderText("Your message here...")).toHaveValue("Great game!");
  });
});
