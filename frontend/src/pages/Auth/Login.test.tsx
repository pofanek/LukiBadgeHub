import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Login from "./Login";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
}));

vi.mock("../../utils/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      resend: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

vi.mock("../../components/UI", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../components/UI")>();
  return {
    ...actual,
    Turnstile: ({ onTokenChange }: { onTokenChange: (token: string | null) => void }) => <button type="button" onClick={() => onTokenChange("captcha-token")}>Complete security check</button>,
  };
});

describe("Login", () => {
  it("requires a Turnstile token and sends it with password sign-in", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<BrowserRouter><Login /></BrowserRouter>);

    const submit = screen.getByRole("button", { name: "Login" });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Complete security check" }));
    await user.type(screen.getByPlaceholderText("Email"), "player@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(submit);

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "player@example.com",
      password: "password123",
      options: { captchaToken: "captcha-token" },
    });
  });
});
