import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "./ResetPassword";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  rpc: vi.fn(),
  setSession: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../../utils/supabase", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
      setSession: mocks.setSession,
      updateUser: mocks.updateUser,
    },
    rpc: mocks.rpc,
  },
}));

describe("ResetPassword", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/reset-password");
  });

  it("keeps the form enabled after a PKCE recovery code is exchanged", async () => {
    window.history.replaceState({}, "", "/reset-password?code=recovery-code");
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(<BrowserRouter><ResetPassword /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New password")).toBeEnabled();
    });
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("recovery-code");
  });

  it("establishes the session from an implicit recovery URL", async () => {
    window.history.replaceState({}, "", "/reset-password#access_token=access-token&refresh_token=refresh-token&type=recovery");
    mocks.setSession.mockResolvedValue({ error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(<BrowserRouter><ResetPassword /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New password")).toBeEnabled();
    });
    expect(mocks.setSession).toHaveBeenCalledWith({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
  });

  it("shows a success notification after the password is changed", async () => {
    window.history.replaceState({}, "", "/reset-password?code=recovery-code");
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    const user = userEvent.setup();

    render(<BrowserRouter><ResetPassword /></BrowserRouter>);

    await user.type(await screen.findByPlaceholderText("New password"), "NewPassword1");
    await user.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByText("Password changed successfully.")).toBeVisible();
  });
});
