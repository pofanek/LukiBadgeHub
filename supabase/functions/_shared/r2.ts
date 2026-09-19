import { AwsClient } from "npm:aws4fetch@1.0.20";

type R2Config = {
  bucketName: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function requiredSecret(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("R2 storage is not configured.");
  return value;
}

export function getR2Config(): R2Config {
  const endpoint = requiredSecret("R2_ENDPOINT").replace(/\/$/, "");
  const parsedEndpoint = new URL(endpoint);
  if (parsedEndpoint.protocol !== "https:") {
    throw new Error("R2 storage is not configured.");
  }

  return {
    bucketName: requiredSecret("R2_BUCKET_NAME"),
    endpoint,
    accessKeyId: requiredSecret("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredSecret("R2_SECRET_ACCESS_KEY"),
  };
}

export function r2Client(config: R2Config) {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: "auto",
    service: "s3",
  });
}

export function r2ObjectUrl(config: R2Config, path: string) {
  const encodedBucket = encodeURIComponent(config.bucketName);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${config.endpoint}/${encodedBucket}/${encodedPath}`;
}

export async function deleteR2Object(config: R2Config, path: string) {
  const response = await r2Client(config).fetch(
    new Request(r2ObjectUrl(config, path), { method: "DELETE" }),
  );
  if (!response.ok && response.status !== 404) {
    throw new Error("The media file could not be removed.");
  }
}

export type R2ObjectMetadata = {
  contentType: string | null;
  contentLength: number;
};

export async function headR2Object(
  config: R2Config,
  path: string,
): Promise<R2ObjectMetadata | null> {
  const response = await r2Client(config).fetch(
    new Request(r2ObjectUrl(config, path), { method: "HEAD" }),
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("The uploaded media could not be verified.");

  const contentLength = Number(response.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
    throw new Error("The uploaded media could not be verified.");
  }

  return {
    contentLength,
    contentType: response.headers.get("content-type"),
  };
}

export async function readR2ObjectRange(
  config: R2Config,
  path: string,
  start: number,
  end: number,
) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start) {
    throw new Error("The uploaded media could not be verified.");
  }
  const response = await r2Client(config).fetch(
    new Request(r2ObjectUrl(config, path), {
      method: "GET",
      headers: { Range: `bytes=${start}-${end}` },
    }),
  );
  if (!response.ok && response.status !== 206) {
    throw new Error("The uploaded media could not be verified.");
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function readR2ObjectPrefix(
  config: R2Config,
  path: string,
  byteLength = 32,
) {
  return readR2ObjectRange(config, path, 0, byteLength - 1);
}

export async function readR2Object(
  config: R2Config,
  path: string,
  maxBytes: number,
) {
  const response = await r2Client(config).fetch(
    new Request(r2ObjectUrl(config, path), { method: "GET" }),
  );
  if (!response.ok || !response.body) {
    throw new Error("The uploaded media could not be verified.");
  }
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isSafeInteger(declaredLength) && declaredLength > maxBytes) {
    await response.body.cancel();
    throw new Error("The uploaded media exceeds the allowed size.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) {
        await reader.cancel();
        throw new Error("The uploaded media exceeds the allowed size.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

export async function putR2Object(
  config: R2Config,
  path: string,
  bytes: Uint8Array,
  contentType: string,
  cacheControl: string,
) {
  const response = await r2Client(config).fetch(
    new Request(r2ObjectUrl(config, path), {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
      body: bytes,
    }),
  );
  if (!response.ok) throw new Error("The uploaded media could not be activated.");
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

export async function deleteR2Prefix(config: R2Config, prefix: string) {
  const client = r2Client(config);
  let continuationToken: string | null = null;

  do {
    const listUrl = new URL(`${config.endpoint}/${encodeURIComponent(config.bucketName)}`);
    listUrl.searchParams.set("list-type", "2");
    listUrl.searchParams.set("prefix", prefix);
    if (continuationToken) listUrl.searchParams.set("continuation-token", continuationToken);

    const listResponse = await client.fetch(listUrl);
    if (!listResponse.ok) throw new Error("The account media could not be removed.");
    const xml = await listResponse.text();
    const paths = [...xml.matchAll(/<Key>([\s\S]*?)<\/Key>/g)].map((match) => decodeXml(match[1]));

    for (const path of paths) {
      const deleteResponse = await client.fetch(
        new Request(r2ObjectUrl(config, path), { method: "DELETE" }),
      );
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error("The account media could not be removed.");
      }
    }

    const nextToken = xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1];
    continuationToken = nextToken ? decodeXml(nextToken) : null;
  } while (continuationToken);
}
