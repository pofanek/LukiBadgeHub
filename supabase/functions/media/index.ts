import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import {
  deleteR2Object,
  getR2Config,
  headR2Object,
  putR2Object,
  readR2Object,
  r2Client,
  r2ObjectUrl,
} from "../_shared/r2.ts";
import {
  mediaContentTypes,
  type MediaContentType,
  validateVerifiedImage,
} from "../_shared/imageValidation.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const mediaCacheControl = "public, max-age=604800, immutable";
const cmsRoles = new Set(["Admin", "Owner"]);
const badgeTiers = new Set(["low", "mid", "high"]);
const uploadTtlSeconds = 600;
const pendingUploadRetentionHours = 24;
const cleanupBatchSize = 100;

const uploadPolicies = {
  "profile-avatar": { maxBytes: 5 * 1024 * 1024, folder: "avatar" },
  "profile-banner": { maxBytes: 5 * 1024 * 1024, folder: "banner" },
  "game-cover": { maxBytes: 10 * 1024 * 1024, folder: "cover" },
  "game-banner": { maxBytes: 10 * 1024 * 1024, folder: "banner" },
  "badge-icon": { maxBytes: 10 * 1024 * 1024, folder: "badges" },
} as const;

type UploadTarget = keyof typeof uploadPolicies;
type MediaAction = "sign-upload" | "confirm-upload" | "cleanup-stale";
type MediaRequest = {
  action?: MediaAction;
  target?: UploadTarget;
  contentType?: string;
  contentLength?: number;
  gameId?: number;
  badgeId?: number;
  uploadId?: string;
  badgeDifficulty?: string;
  badgeTier?: string;
};
type PendingUpload = {
  id: string;
  owner_id: string;
  target: UploadTarget;
  object_path: string;
  staging_object_path: string | null;
  declared_content_type: MediaContentType;
  declared_bytes: number;
  max_bytes: number;
  game_id: number | null;
  badge_id: number | null;
  badge_difficulty: "inhuman" | null;
  badge_tier: "low" | "mid" | "high" | null;
  status: "pending" | "verified" | "activated" | "invalid" | "expired";
  expires_at: string;
};

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function extensionFor(contentType: MediaContentType) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  return "webp";
}

function isUploadTarget(value: unknown): value is UploadTarget {
  return typeof value === "string" && value in uploadPolicies;
}

function isMediaContentType(value: unknown): value is MediaContentType {
  return typeof value === "string" && mediaContentTypes.includes(value as MediaContentType);
}

function isSafeObjectPath(path: string | null | undefined): path is string {
  return Boolean(path) && !path.startsWith("http://") && !path.startsWith("https://");
}

function requiredEnvironment(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("Media storage is not configured.");
  return value;
}

function isServiceRoleRequest(request: Request, serviceRoleKey: string) {
  return request.headers.get("Authorization") === `Bearer ${serviceRoleKey}`;
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

async function assertUploadResource(
  body: MediaRequest,
  userId: string,
  admin: ReturnType<typeof createClient>,
) {
  if (!isUploadTarget(body.target)) throw new HttpError("A valid media target is required.", 400);
  if (body.target === "profile-avatar" || body.target === "profile-banner") return;
  if (!Number.isSafeInteger(body.gameId) || !body.gameId || body.gameId < 1) {
    throw new HttpError("A valid game is required.", 400);
  }
  await requireCmsRole(admin, userId);
  const { data: game, error: gameError } = await admin.from("games").select("id").eq("id", body.gameId).maybeSingle();
  if (gameError) throw gameError;
  if (!game) throw new HttpError("The game could not be found.", 404);
  if (body.target !== "badge-icon") return;
  if (!Number.isSafeInteger(body.badgeId) || !body.badgeId || body.badgeId < 1) {
    throw new HttpError("A valid badge is required.", 400);
  }
  const { data: badge, error: badgeError } = await admin
    .from("game_badges")
    .select("id")
    .eq("id", body.badgeId)
    .eq("game_id", body.gameId)
    .maybeSingle();
  if (badgeError) throw badgeError;
  if (!badge) throw new HttpError("The badge could not be found.", 404);
}

async function currentMediaPath(
  body: MediaRequest,
  userId: string,
  admin: ReturnType<typeof createClient>,
) {
  if (!isUploadTarget(body.target)) throw new HttpError("A valid media target is required.", 400);
  if (body.target === "profile-avatar" || body.target === "profile-banner") {
    const column = body.target === "profile-avatar" ? "avatar_path" : "banner_path";
    const { data, error } = await admin.from("user_profiles").select(column).eq("id", userId).maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError("Your profile could not be found.", 404);
    return data[column] as string | null;
  }
  if (body.target === "game-cover" || body.target === "game-banner") {
    const column = body.target === "game-cover" ? "cover_path" : "banner_path";
    const { data, error } = await admin.from("games").select(column).eq("id", body.gameId!).maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError("The game could not be found.", 404);
    return data[column] as string | null;
  }
  const { data, error } = await admin.from("game_badges").select("icon_path").eq("id", body.badgeId!).eq("game_id", body.gameId!).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError("The badge could not be found.", 404);
  return data.icon_path as string | null;
}

function assertBadgeMetadata(body: MediaRequest) {
  if (body.target !== "badge-icon") return;
  if (body.badgeDifficulty !== "inhuman" || !badgeTiers.has(body.badgeTier || "")) {
    throw new HttpError("Custom icons require an Inhuman badge and a valid tier.", 400);
  }
}

function createObjectPath(
  target: UploadTarget,
  userId: string,
  contentType: MediaContentType,
  gameId?: number,
  badgeId?: number,
) {
  const filename = `${crypto.randomUUID()}.${extensionFor(contentType)}`;
  if (target === "profile-avatar" || target === "profile-banner") {
    return `${userId}/${uploadPolicies[target].folder}/${filename}`;
  }
  if (target === "badge-icon") return `games/${gameId}/badges/${badgeId}/${filename}`;
  return `games/${gameId}/${uploadPolicies[target].folder}/${filename}`;
}

function createStagingObjectPath(uploadId: string, contentType: MediaContentType) {
  return `pending/${uploadId}.${extensionFor(contentType)}`;
}

async function signedUpload(
  body: MediaRequest,
  userId: string,
  admin: ReturnType<typeof createClient>,
) {
  if (!isUploadTarget(body.target) || !isMediaContentType(body.contentType)) {
    throw new HttpError("Use a JPEG, PNG, or WebP image.", 400);
  }
  const policy = uploadPolicies[body.target];
  if (!Number.isSafeInteger(body.contentLength) || !body.contentLength || body.contentLength < 1) {
    throw new HttpError("A valid image size is required.", 400);
  }
  if (body.contentLength > policy.maxBytes) {
    throw new HttpError(`Images must be ${policy.maxBytes / 1024 / 1024} MB or smaller.`, 400);
  }
  assertBadgeMetadata(body);
  await assertUploadResource(body, userId, admin);
  const expectedPreviousObjectPath = await currentMediaPath(body, userId, admin);
  const uploadId = crypto.randomUUID();
  const objectPath = createObjectPath(body.target, userId, body.contentType, body.gameId, body.badgeId);
  const stagingObjectPath = createStagingObjectPath(uploadId, body.contentType);
  const config = getR2Config();
  const uploadUrl = new URL(r2ObjectUrl(config, stagingObjectPath));
  uploadUrl.searchParams.set("X-Amz-Expires", String(uploadTtlSeconds));
  const signedRequest = await r2Client(config).sign(
    new Request(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": body.contentType, "Cache-Control": mediaCacheControl },
    }),
    { aws: { signQuery: true } },
  );
  const { data, error } = await admin
    .from("media_uploads")
    .insert({
      id: uploadId,
      owner_id: userId,
      target: body.target,
      object_path: objectPath,
      staging_object_path: stagingObjectPath,
      expected_previous_object_path: expectedPreviousObjectPath,
      declared_content_type: body.contentType,
      declared_bytes: body.contentLength,
      max_bytes: policy.maxBytes,
      game_id: body.target.startsWith("game-") || body.target === "badge-icon" ? body.gameId : null,
      badge_id: body.target === "badge-icon" ? body.badgeId : null,
      badge_difficulty: body.target === "badge-icon" ? body.badgeDifficulty : null,
      badge_tier: body.target === "badge-icon" ? body.badgeTier : null,
    })
    .select("id")
    .single();
  if (error || !data) throw error || new Error("The upload could not be prepared.");
  return { uploadId: data.id, uploadUrl: signedRequest.url };
}

async function expireOrInvalidateUpload(
  admin: ReturnType<typeof createClient>,
  upload: PendingUpload,
  status: "expired" | "invalid",
) {
  if (isSafeObjectPath(upload.staging_object_path)) {
    await deleteR2Object(getR2Config(), upload.staging_object_path).catch(() => undefined);
  }
  await admin.from("media_uploads").update({ status }).eq("id", upload.id).in("status", ["pending", "verified"]);
}

async function confirmUpload(
  body: MediaRequest,
  userId: string,
  admin: ReturnType<typeof createClient>,
) {
  if (!body.uploadId || typeof body.uploadId !== "string") {
    throw new HttpError("The upload could not be found.", 404);
  }
  const { data, error } = await admin
    .from("media_uploads")
    .select("id, owner_id, target, object_path, staging_object_path, declared_content_type, declared_bytes, max_bytes, game_id, badge_id, badge_difficulty, badge_tier, status, expires_at")
    .eq("id", body.uploadId)
    .maybeSingle();
  if (error) throw error;
  const upload = data as PendingUpload | null;
  if (!upload || upload.owner_id !== userId || upload.status !== "pending") {
    throw new HttpError("The upload could not be found.", 404);
  }
  await assertUploadResource({
    target: upload.target,
    gameId: upload.game_id || undefined,
    badgeId: upload.badge_id || undefined,
  }, userId, admin);
  if (new Date(upload.expires_at).getTime() <= Date.now()) {
    await expireOrInvalidateUpload(admin, upload, "expired");
    throw new HttpError("The upload expired. Choose the image again.", 400);
  }
  const config = getR2Config();
  if (!upload.staging_object_path) {
    throw new HttpError("The upload could not be found.", 404);
  }
  const object = await headR2Object(config, upload.staging_object_path);
  if (!object || object.contentLength === 0) {
    await expireOrInvalidateUpload(admin, upload, "invalid");
    throw new HttpError("The uploaded file is not a supported image.", 400);
  }
  if (object.contentLength > upload.max_bytes) {
    await expireOrInvalidateUpload(admin, upload, "invalid");
    throw new HttpError("The uploaded image exceeds the allowed size.", 400);
  }
  let bytes: Uint8Array;
  try {
    bytes = await readR2Object(config, upload.staging_object_path, upload.max_bytes);
  } catch {
    await expireOrInvalidateUpload(admin, upload, "invalid");
    throw new HttpError("The uploaded image exceeds the allowed size.", 400);
  }
  const verification = validateVerifiedImage({
    declaredContentType: upload.declared_content_type,
    objectContentType: object.contentType,
    objectSize: object.contentLength,
    maxBytes: upload.max_bytes,
    bytes,
  });
  if ("error" in verification) {
    await expireOrInvalidateUpload(admin, upload, "invalid");
    throw new HttpError(verification.error, 400);
  }
  const { data: claimed, error: claimError } = await admin
    .from("media_uploads")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", upload.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimed) throw new HttpError("The upload was already processed.", 409);
  await putR2Object(config, upload.object_path, bytes, verification.contentType, mediaCacheControl);
  const { data: activated, error: activationError } = await admin.rpc("activate_media_upload", {
    p_upload_id: upload.id,
    p_badge_difficulty: upload.badge_difficulty,
    p_badge_tier: upload.badge_tier,
  });
  if (activationError || !activated?.[0]?.object_path) {
    throw new HttpError("The uploaded image could not be activated. Try again.", 409);
  }
  const result = activated[0] as { object_path: string; previous_object_path: string | null };
  if (await cleanObject(config, upload.staging_object_path)) {
    await admin.from("media_uploads").update({ staging_object_path: null }).eq("id", upload.id);
  }
  if (isSafeObjectPath(result.previous_object_path)) {
    const deleted = await deleteR2Object(config, result.previous_object_path!).then(() => true, () => false);
    if (deleted) {
      await admin.from("media_uploads").update({ previous_object_path: null }).eq("id", upload.id).eq("previous_object_path", result.previous_object_path);
    }
  }
  return { path: result.object_path };
}

async function cleanObject(config: ReturnType<typeof getR2Config>, path: string) {
  if (!isSafeObjectPath(path)) return true;
  return deleteR2Object(config, path).then(() => true, () => false);
}

async function cleanupStaleUploads(admin: ReturnType<typeof createClient>) {
  const config = getR2Config();
  const now = new Date().toISOString();
  const [staleResult, invalidResult, activatedResult, queueResult] = await Promise.all([
    admin.from("media_uploads").select("id, object_path, staging_object_path").in("status", ["pending", "verified"]).lt("expires_at", now).order("expires_at", { ascending: true }).limit(cleanupBatchSize),
    admin.from("media_uploads").select("id, object_path, staging_object_path").eq("status", "invalid").order("created_at", { ascending: true }).limit(cleanupBatchSize),
    admin.from("media_uploads").select("id, previous_object_path, staging_object_path").eq("status", "activated").or("previous_object_path.not.is.null,staging_object_path.not.is.null").order("activated_at", { ascending: true }).limit(cleanupBatchSize),
    admin.from("media_cleanup_queue").select("object_path, attempts").order("created_at", { ascending: true }).limit(cleanupBatchSize),
  ]);
  if (staleResult.error || invalidResult.error || activatedResult.error || queueResult.error) {
    throw staleResult.error || invalidResult.error || activatedResult.error || queueResult.error;
  }
  let deleted = 0;
  let failed = 0;
  for (const upload of [...(staleResult.data || []), ...(invalidResult.data || [])]) {
    const paths = [upload.object_path, upload.staging_object_path].filter(isSafeObjectPath);
    const results = await Promise.all(paths.map((path) => cleanObject(config, path)));
    deleted += results.filter(Boolean).length;
    if (results.every(Boolean)) {
      await admin.from("media_uploads").update({ status: "expired" }).eq("id", upload.id);
    } else failed += results.filter((result) => !result).length;
  }
  for (const upload of activatedResult.data || []) {
    if (isSafeObjectPath(upload.previous_object_path)) {
      if (await cleanObject(config, upload.previous_object_path)) {
        deleted += 1;
        await admin.from("media_uploads").update({ previous_object_path: null }).eq("id", upload.id).eq("previous_object_path", upload.previous_object_path);
      } else failed += 1;
    }
    if (isSafeObjectPath(upload.staging_object_path)) {
      if (await cleanObject(config, upload.staging_object_path)) {
        deleted += 1;
        await admin.from("media_uploads").update({ staging_object_path: null }).eq("id", upload.id).eq("staging_object_path", upload.staging_object_path);
      } else failed += 1;
    }
  }
  for (const object of queueResult.data || []) {
    if (await cleanObject(config, object.object_path)) {
      deleted += 1;
      await admin.from("media_cleanup_queue").delete().eq("object_path", object.object_path);
    } else {
      failed += 1;
      await admin.from("media_cleanup_queue").update({ attempts: object.attempts + 1, last_attempt_at: now }).eq("object_path", object.object_path);
    }
  }
  return { deleted, failed, retentionHours: pendingUploadRetentionHours };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });
  try {
    const body = await request.json().catch(() => null) as MediaRequest | null;
    if (!body || !body.action) throw new HttpError("Unknown media action.", 400);
    const supabaseUrl = requiredEnvironment("SUPABASE_URL");
    const publishableKey = requiredEnvironment("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    if (body.action === "cleanup-stale") {
      if (!isServiceRoleRequest(request, serviceRoleKey)) throw new HttpError("Not found.", 404);
      return Response.json(await cleanupStaleUploads(admin), { headers: corsHeaders });
    }
    if (body.action !== "sign-upload" && body.action !== "confirm-upload") throw new HttpError("Unknown media action.", 400);
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new HttpError("Authentication is required.", 401);
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new HttpError("Your session is no longer valid. Sign in and try again.", 401);
    const result = body.action === "sign-upload"
      ? await signedUpload(body, userData.user.id, admin)
      : await confirmUpload(body, userData.user.id, admin);
    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : "Media storage is temporarily unavailable. Try again later.";
    return Response.json({ error: message }, { status, headers: corsHeaders });
  }
});
