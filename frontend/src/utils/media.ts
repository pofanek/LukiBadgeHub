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
  badgeDifficulty?: string;
  badgeTier?: string;
};

type SignedUpload = {
  uploadId: string;
  uploadUrl: string;
};

type ConfirmedUpload = {
  path: string;
};

export function getFunctionErrorMessage(error: unknown, fallback: string) {
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

export async function uploadMedia({
  target,
  file,
  gameId,
  badgeId,
  badgeDifficulty,
  badgeTier,
}: UploadOptions) {
  const { data, error } = await supabase.functions.invoke("media", {
    body: {
      action: "sign-upload",
      target,
      contentType: file.type,
      contentLength: file.size,
      gameId,
      badgeId,
      badgeDifficulty,
      badgeTier,
    },
  });
  if (error || !data?.uploadId || !data?.uploadUrl) {
    throw new Error(await getFunctionErrorMessage(error, "The image could not be uploaded."));
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

  const { data: confirmation, error: confirmationError } = await supabase.functions.invoke("media", {
    body: {
      action: "confirm-upload",
      uploadId: signedUpload.uploadId,
    },
  });
  if (confirmationError || !confirmation?.path) {
    throw new Error(await getFunctionErrorMessage(confirmationError, "The image could not be verified."));
  }
  return (confirmation as ConfirmedUpload).path;
}
