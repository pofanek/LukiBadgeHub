import { supabase } from "./supabase";

const publicMediaBaseUrl = (
  import.meta.env.VITE_R2_PUBLIC_URL || "https://media.lukibadgehub.com"
).replace(/\/$/, "");
const mediaCacheControl = "public, max-age=604800, immutable";

type UploadTarget =
  | "profile-avatar"
  | "profile-banner"
  | "game-cover"
  | "game-banner"
  | "badge-icon";

type UploadOptions = {
  target: UploadTarget;
  file: File;
  gameId?: number;
  badgeId?: number;
};

type SignedUpload = {
  path: string;
  uploadUrl: string;
};

function functionError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "context" in error) {
    const context = error.context;
    if (context instanceof Response) {
      return context
        .json()
        .then((body: { error?: string }) => body.error || fallback)
        .catch(() => fallback);
    }
  }
  return Promise.resolve(fallback);
}

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${publicMediaBaseUrl}/${encodedPath}`;
}

export async function uploadMedia({ target, file, gameId, badgeId }: UploadOptions) {
  const { data, error } = await supabase.functions.invoke("media", {
    body: {
      action: "sign-upload",
      target,
      contentType: file.type,
      gameId,
      badgeId,
    },
  });
  if (error || !data?.path || !data?.uploadUrl) {
    throw new Error(await functionError(error, "The image could not be uploaded."));
  }

  const signedUpload = data as SignedUpload;
  const uploadResponse = await fetch(signedUpload.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "Cache-Control": mediaCacheControl,
    },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("The image could not be uploaded.");
  }
  return signedUpload.path;
}

export async function deleteMedia(path: string | null | undefined) {
  if (!path || path.startsWith("http://") || path.startsWith("https://")) return;
  const { error } = await supabase.functions.invoke("media", {
    body: { action: "delete", path },
  });
  if (error) throw new Error(await functionError(error, "The image could not be removed."));
}
