import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const allowedOrigins = new Set([
  "https://www.lukibadgehub.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
const topics = new Set([
  "Feedback",
  "Bug Report",
  "Feature Request",
  "Balance Suggestion",
  "Other",
]);

type FeedbackRequest = {
  captchaToken?: string;
  email?: string;
  message?: string;
  name?: string;
  topic?: string;
};

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    ...(origin && allowedOrigins.has(origin)
      ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
      : {}),
  };
}

function response(request: Request, body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders(request.headers.get("Origin")),
  });
}

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new HttpError("Feedback is not configured.", 503);
  return value;
}

function asTrimmedString(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length <= limit ? trimmed : "";
}

async function fetchExternal(input: RequestInfo | URL, init: RequestInit) {
  try {
    return await fetch(input, { ...init, signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HttpError("Feedback service is temporarily unavailable.", 503);
    }
    throw error;
  }
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, remoteIp: string) {
  const form = new FormData();
  form.set("secret", requiredSecret("TURNSTILE_SECRET_KEY"));
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  const verification = await fetchExternal(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const result = (await verification.json().catch(() => null)) as {
    success?: boolean;
  } | null;
  if (!verification.ok || !result?.success) {
    throw new HttpError("Complete the security check and try again.", 400);
  }
}

function feedbackWebhookUrl() {
  const value = requiredSecret("DISCORD_FEEDBACK_WEBHOOK_URL");
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "discord.com" ||
    !url.pathname.startsWith("/api/webhooks/")
  ) {
    throw new HttpError("Feedback is not configured.", 503);
  }
  return url;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    return allowedOrigins.has(origin ?? "")
      ? new Response("ok", { headers: corsHeaders(origin) })
      : response(request, { error: "Origin not allowed." }, 403);
  }
  if (!allowedOrigins.has(origin ?? "")) {
    return response(request, { error: "Origin not allowed." }, 403);
  }
  if (request.method !== "POST") {
    return response(request, { error: "Method not allowed." }, 405);
  }

  try {
    const body = (await request.json().catch(() => null)) as FeedbackRequest | null;
    const name = asTrimmedString(body?.name, 100) || "Name not provided";
    const email = asTrimmedString(body?.email, 254);
    // Discord embed field values are limited to 1,024 characters.
    const message = asTrimmedString(body?.message, 1_024);
    const topic = asTrimmedString(body?.topic, 50);
    const captchaToken = asTrimmedString(body?.captchaToken, 2_048);
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !message ||
      !topics.has(topic) ||
      !captchaToken
    ) {
      throw new HttpError(
        "Enter a valid email, topic, message, and security check.",
        400,
      );
    }

    const forwardedFor =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    await verifyTurnstile(
      captchaToken,
      forwardedFor === "unknown" ? "" : forwardedFor,
    );

    const admin = createClient(
      requiredSecret("SUPABASE_URL"),
      requiredSecret("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: allowed, error: rateLimitError } = await admin.rpc(
      "consume_feedback_rate_limit",
      // Rate-limit the network source, not a client-controlled e-mail address.
      { p_key_hash: await sha256(forwardedFor) },
    );
    if (rateLimitError) throw rateLimitError;
    if (!allowed) {
      throw new HttpError("Too many messages. Try again in a few minutes.", 429);
    }

    const webhookResponse = await fetchExternal(feedbackWebhookUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `CATEGORY: ${topic.toUpperCase()}`,
            timestamp: new Date().toISOString(),
            fields: [
              { name: "Name", value: name, inline: true },
              { name: "E-mail", value: email, inline: true },
              { name: "Message", value: message },
            ],
          },
        ],
      }),
    });
    if (!webhookResponse.ok) throw new Error("Feedback delivery failed.");
    return response(request, { delivered: true });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message =
      error instanceof HttpError
        ? error.message
        : "Feedback could not be delivered.";
    return response(request, { error: message }, status);
  }
});
