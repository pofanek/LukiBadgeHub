import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const deletionVerificationWindowMs = 15 * 60 * 1000;

type DeletionAction = "begin" | "verify-email" | "delete";

type DeletionRequest = {
  action?: DeletionAction;
  confirmation?: string;
  currentPassword?: string;
};

async function listFiles(
  storage: ReturnType<typeof createClient>["storage"],
  prefix: string,
): Promise<string[]> {
  const { data, error } = await storage.from("profile-media").list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;

  const paths: string[] = [];
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id) paths.push(path);
    else paths.push(...(await listFiles(storage, path)));
  }
  return paths;
}

function emailOtpTimestamp(authorization: string): number | null {
  try {
    const token = authorization.replace(/^Bearer\s+/i, "");
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      amr?: { method?: string; timestamp?: string }[];
    };
    const timestamps = (payload.amr ?? [])
      .filter((method) => method.method === "otp")
      .map((method) => Date.parse(method.timestamp ?? ""))
      .filter(Number.isFinite);
    return timestamps.length ? Math.max(...timestamps) : null;
  } catch {
    return null;
  }
}

function isRecent(timestamp?: string | null) {
  return Boolean(timestamp) && Date.now() - new Date(timestamp as string).getTime() <= deletionVerificationWindowMs;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }

  const body = await request.json().catch(() => null) as DeletionRequest | null;
  const action = body?.action;
  if (action !== "begin" && action !== "verify-email" && action !== "delete") {
    return Response.json({ error: "Unknown account deletion action." }, { status: 400, headers: corsHeaders });
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return Response.json({ error: "Authentication is required." }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
    return Response.json({ error: "Account deletion is not configured." }, { status: 500, headers: corsHeaders });
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ error: "Your session is no longer valid. Sign in and try again." }, { status: 401, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (action === "begin") {
      if (!body?.currentPassword) {
        return Response.json({ error: "Enter your current password to continue." }, { status: 400, headers: corsHeaders });
      }

      const passwordClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: passwordData, error: passwordError } = await passwordClient.auth.signInWithPassword({
        email: userData.user.email ?? "",
        password: body.currentPassword,
      });
      if (passwordError || passwordData.user?.id !== userData.user.id) {
        return Response.json({ error: "Your current password is incorrect." }, { status: 401, headers: corsHeaders });
      }

      const now = new Date().toISOString();
      const { error: challengeError } = await admin.from("account_deletion_requests").upsert({
        user_id: userData.user.id,
        password_verified_at: now,
        email_verification_requested_at: now,
        email_verified_at: null,
      }, { onConflict: "user_id" });
      if (challengeError) throw challengeError;

      return Response.json({ emailVerificationRequired: true }, { headers: corsHeaders });
    }

    const { data: challenge, error: challengeError } = await admin
      .from("account_deletion_requests")
      .select("password_verified_at, email_verification_requested_at, email_verified_at")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (challengeError) throw challengeError;
    if (!challenge || !isRecent(challenge.password_verified_at)) {
      return Response.json({ error: "Your deletion verification expired. Start again." }, { status: 403, headers: corsHeaders });
    }

    if (action === "verify-email") {
      const verifiedAt = emailOtpTimestamp(authorization);
      const requestedAt = new Date(challenge.email_verification_requested_at).getTime();
      if (!verifiedAt || verifiedAt < requestedAt || Date.now() - verifiedAt > deletionVerificationWindowMs) {
        return Response.json({ error: "Open the latest deletion verification email before continuing." }, { status: 403, headers: corsHeaders });
      }

      const { error: markVerifiedError } = await admin
        .from("account_deletion_requests")
        .update({ email_verified_at: new Date().toISOString() })
        .eq("user_id", userData.user.id);
      if (markVerifiedError) throw markVerifiedError;
      return Response.json({ emailVerified: true }, { headers: corsHeaders });
    }

    if (body?.confirmation !== "DELETE") {
      return Response.json({ error: "Type DELETE to confirm account deletion." }, { status: 400, headers: corsHeaders });
    }
    if (!isRecent(challenge.email_verified_at)) {
      return Response.json({ error: "Verify your email before deleting your account." }, { status: 403, headers: corsHeaders });
    }

    const paths = await listFiles(admin.storage, userData.user.id);
    if (paths.length > 0) {
      const { error: removeError } = await admin.storage.from("profile-media").remove(paths);
      if (removeError) throw removeError;
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userData.user.id, false);
    if (deleteError) throw deleteError;
    return Response.json({ deleted: true }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Account deletion failed.";
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
