"""End-to-end regression coverage for the email/password login flow.

Run with a confirmed, dedicated test account:
  E2E_LOGIN_EMAIL=... E2E_LOGIN_PASSWORD=... \\
    python .agents/skills/webapp-testing/scripts/with_server.py \\
      --server "cd frontend && npm run dev" --port 5173 -- python tests/login_flow.py
"""

import os
from dataclasses import dataclass
from typing import Any

from playwright.sync_api import (
    ConsoleMessage,
    Page,
    Response,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)


APP_URL = os.getenv("E2E_APP_URL", "http://127.0.0.1:5173")


@dataclass
class Diagnostics:
    console_errors: list[str]
    token_responses: list[dict[str, Any]]


def require_test_account() -> tuple[str, str]:
    email = os.getenv("E2E_LOGIN_EMAIL")
    password = os.getenv("E2E_LOGIN_PASSWORD")
    if not email or not password:
        raise RuntimeError(
            "Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD for a confirmed test account."
        )
    return email, password


def collect_diagnostics(page: Page) -> Diagnostics:
    diagnostics = Diagnostics(console_errors=[], token_responses=[])

    def record_console(message: ConsoleMessage) -> None:
        if message.type == "error":
            diagnostics.console_errors.append(message.text)

    def record_auth_response(response: Response) -> None:
        if "/auth/v1/token" not in response.url:
            return
        body: dict[str, Any]
        try:
            response_json = response.json()
            body = {
                key: value
                for key, value in response_json.items()
                if key not in {"access_token", "refresh_token"}
            }
        except Exception:
            body = {"body": "non-JSON response"}
        diagnostics.token_responses.append(
            {"status": response.status, "url": response.url, "body": body}
        )

    page.on("console", record_console)
    page.on("response", record_auth_response)
    return diagnostics


def open_login(page: Page) -> None:
    page.goto(f"{APP_URL}/login")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Log In").wait_for()


def fill_and_submit(page: Page, email: str, password: str) -> None:
    page.locator("#name").fill(email)
    page.locator("#password").fill(password)
    page.get_by_role("button", name="Login").click()


def has_persisted_supabase_session(page: Page) -> bool:
    return any(
        key.startswith("sb-") and key.endswith("-auth-token")
        for key in page.evaluate("Object.keys(localStorage)")
    )


def test_confirmed_user_can_log_in(page: Page, email: str, password: str) -> None:
    diagnostics = collect_diagnostics(page)
    open_login(page)
    fill_and_submit(page, email, password)
    try:
        page.wait_for_url(f"{APP_URL}/", timeout=10_000)
    except PlaywrightTimeoutError as error:
        raise AssertionError(
            f"Expected authenticated navigation to /, got {page.url}. Diagnostics: {diagnostics}"
        ) from error

    if not has_persisted_supabase_session(page):
        raise AssertionError(f"Login navigated without a persisted session: {diagnostics}")
    if diagnostics.console_errors:
        raise AssertionError(f"Login emitted console errors: {diagnostics}")
    if not any(response["status"] == 200 for response in diagnostics.token_responses):
        raise AssertionError(f"Login did not receive a successful token response: {diagnostics}")


def test_signed_in_user_can_open_their_profile(page: Page, email: str, password: str) -> None:
    open_login(page)
    fill_and_submit(page, email, password)
    page.wait_for_url(f"{APP_URL}/", timeout=10_000)

    page.get_by_role("button", name="Open profile menu").click()
    profile_link = page.get_by_role("link", name="Profile").first
    href = profile_link.get_attribute("href")
    if not href or not href.startswith("/profile/"):
        raise AssertionError(f"Expected a user-specific profile link, got {href!r}")

    profile_link.click()
    page.wait_for_url(f"{APP_URL}{href}", timeout=10_000)
    page.get_by_role("heading", level=1).wait_for()


def test_mobile_menu_routes_and_logs_out(page: Page, email: str, password: str) -> None:
    page.set_viewport_size({"width": 390, "height": 844})
    open_login(page)
    fill_and_submit(page, email, password)
    page.wait_for_url(f"{APP_URL}/", timeout=10_000)

    page.get_by_role("button", name="Open navigation menu").click()
    menu = page.get_by_label("Main navigation menu")
    menu.get_by_role("link", name="Games").wait_for()

    expected_paths = {
        "Games": "/games",
        "Rankings": "/rankings",
        "Friends": "/friends",
        "Notifications": "/notifications",
        "Billing": "/billing",
        "Settings": "/settings",
    }
    for label, path in expected_paths.items():
        href = menu.get_by_role("link", name=label).get_attribute("href")
        if href != path:
            raise AssertionError(f"Expected {label} to link to {path}, got {href!r}")

    profile_href = menu.get_by_role("link", name="Profile").get_attribute("href")
    if not profile_href or not profile_href.startswith("/profile/"):
        raise AssertionError(f"Expected menu profile link to be user-specific, got {profile_href!r}")

    for label in ("Discord", "Support Me!"):
        href = menu.get_by_role("link", name=label).get_attribute("href")
        if not href or not href.startswith("https://"):
            raise AssertionError(f"Expected {label} to be an external link, got {href!r}")

    menu.get_by_role("button", name="Logout").click()
    page.wait_for_url(f"{APP_URL}/login", timeout=10_000)
    if has_persisted_supabase_session(page):
        raise AssertionError("Logout did not clear the persisted Supabase session")


def test_wrong_password_shows_a_clear_error(page: Page, email: str, password: str) -> None:
    diagnostics = collect_diagnostics(page)
    open_login(page)
    fill_and_submit(page, email, f"wrong-{password}")

    error = page.get_by_text("ERROR:")
    try:
        error.wait_for(timeout=10_000)
    except PlaywrightTimeoutError as exception:
        raise AssertionError(
            f"Wrong-password error was not rendered. Diagnostics: {diagnostics}"
        ) from exception
    error_text = error.text_content() or ""
    if error_text == "ERROR:" or not error_text.startswith("ERROR: "):
        raise AssertionError(f"Expected a readable login error, got {error_text!r}")
    if not any(response["status"] == 400 for response in diagnostics.token_responses):
        raise AssertionError(f"Wrong password did not produce a 400 token response: {diagnostics}")
    unexpected_console_errors = [
        message
        for message in diagnostics.console_errors
        if message != "Failed to load resource: the server responded with a status of 400 ()"
    ]
    if unexpected_console_errors:
        raise AssertionError(f"Wrong-password flow emitted console errors: {diagnostics}")


def main() -> None:
    email, password = require_test_account()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            valid_page = browser.new_page()
            test_confirmed_user_can_log_in(valid_page, email, password)

            profile_page = browser.new_page()
            test_signed_in_user_can_open_their_profile(profile_page, email, password)

            menu_page = browser.new_page()
            test_mobile_menu_routes_and_logs_out(menu_page, email, password)

            invalid_page = browser.new_page()
            test_wrong_password_shows_a_clear_error(invalid_page, email, password)
        finally:
            browser.close()


if __name__ == "__main__":
    main()
