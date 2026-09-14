import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { getR2Config, r2Client, r2ObjectUrl, deleteR2Object } from "../_shared/r2.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const mediaCacheControl = "public, max-age=604800, immutable";
const cmsRoles = new Set(["Admin", "Owner"]);

type UploadTarget =
  | "profile-avatar"
  | "profile-banner"
  | "game-cover"
  | "game-banner"
  | "badge-icon";

type MediaRequest = {
  action?: "sign-upload" | "delete";
  target?: UploadTarget;
  contentType?: string;
  gameId?: number;
  badgeId?: number;
  path?: string;
};

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function extensionFor(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  return "webp";
}

function isOwnProfilePath(path: string, userId: string) {
  return path.startsWith(`${userId}/avatar/`) || path.startsWith(`${userId}/banner/`);
}

async function requireCmsRole(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !cmsRoles.has(data.role)) {
    throw new HttpError("You do not have permission to manage game media.", 403);
  }
}

async function signedUpload(
  body: MediaRequest,
  userId: string,
  admin: ReturnType<typeof createClient>,
) {
  if (!body.target || !body.contentType || !allowedContentTypes.has(body.contentType)) {
    throw new HttpError("Use a JPEG, PNG, or WebP image.", 400);
  }

  const extension = extensionFor(body.contentType);
  let path: string;
  if (body.target === "profile-avatar" || body.target === "profile-banner") {
    const folder = body.target === "profile-avatar" ? "avatar" : "banner";
    path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  } else {
    if (!Number.isSafeInteger(body.gameId) || !body.gameId || !body.target.startsWith("game-") && body.target !== "badge-icon") {
      throw new HttpError("A valid game is required.", 400);
    }
    await requireCmsRole(admin, userId);

    if (body.target === "game-cover" || body.target === "game-banner") {
      const folder = body.target === "game-cover" ? "cover" : "banner";
      path = `games/${body.gameId}/${folder}/${crypto.randomUUID()}.webp`;
    } else {
      if (!Number.isSafeInteger(body.badgeId) || !body.badgeId) {
        throw new HttpError("A valid badge is required.", 400);
      }
      const { data: badge, error } = await admin
        .from("game_badges")
        .select("id")
        .eq("id", body.badgeId)
        .eq("game_id", body.gameId)
        .maybeSingle();
      if (error) throw error;
      if (!badge) throw new HttpError("The badge could not be found.", 404);
      path = `games/${body.gameId}/badges/${body.badgeId}/${crypto.randomUUID()}.${extension}`;
    }
  }

  const config = getR2Config();
  const uploadUrl = new URL(r2ObjectUrl(config, path));
  uploadUrl.searchParams.set("X-Amz-Expires", "600");
  const signedRequest = await r2Client(config).sign(
    new Request(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": body.contentType,
        "Cache-Control": mediaCacheControl,
      },
    }),
    { aws: { signQuery: true } },
  );
  return { path, uploadUrl: signedRequest.url };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json().catch(() => null) as MediaRequest | null;
    if (!body || (body.action !== "sign-upload" && body.action !== "delete")) {
      throw new HttpError("Unknown media action.", 400);
    }

    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new HttpError("Authentication is required.", 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
      throw new Error("Media storage is not configured.");
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      throw new HttpError("Your session is no longer valid. Sign in and try again.", 401);
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (body.action === "sign-upload") {
      const result = await signedUpload(body, userData.user.id, admin);
      return Response.json(result, { headers: corsHeaders });
    }

    if (!body.path || body.path.includes("..") || body.path.startsWith("/")) {
      throw new HttpError("Invalid media path.", 400);
    }
    if (!isOwnProfilePath(body.path, userData.user.id)) {
      await requireCmsRole(admin, userData.user.id);
      if (!body.path.startsWith("games/")) {
        throw new HttpError("You do not have permission to remove this media.", 403);
      }
    }
    await deleteR2Object(getR2Config(), body.path);
    return Response.json({ deleted: true }, { headers: corsHeaders });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Media storage failed.";
    return Response.json({ error: message }, { status, headers: corsHeaders });
  }
});
