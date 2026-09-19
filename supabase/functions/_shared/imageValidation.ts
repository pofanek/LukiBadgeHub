export const mediaContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type MediaContentType = (typeof mediaContentTypes)[number];

type VerificationInput = {
  declaredContentType: MediaContentType;
  objectContentType: string | null;
  objectSize: number;
  maxBytes: number;
  bytes: Uint8Array;
};

type VerificationResult =
  | { contentType: MediaContentType }
  | { error: string };

function bytesMatch(bytes: Uint8Array, expected: readonly number[], offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function bigEndianUint32(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function littleEndianUint32(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function crc32(bytes: Uint8Array, start: number, end: number) {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function hasValidPngStructure(bytes: Uint8Array) {
  if (!bytesMatch(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) return false;
  let offset = 8;
  let hasHeader = false;
  let hasImageData = false;
  while (offset + 12 <= bytes.length) {
    const length = bigEndianUint32(bytes, offset);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcOffset = dataEnd;
    if (dataEnd > bytes.length - 4) return false;
    if (crc32(bytes, offset + 4, dataEnd) !== bigEndianUint32(bytes, crcOffset)) return false;
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (!hasHeader) {
      if (type !== "IHDR" || length !== 13 || bigEndianUint32(bytes, dataStart) === 0 || bigEndianUint32(bytes, dataStart + 4) === 0) return false;
      hasHeader = true;
    } else if (type === "IDAT") {
      hasImageData ||= length > 0;
    } else if (type === "IEND") {
      return length === 0 && hasImageData && crcOffset + 4 === bytes.length;
    }
    offset = crcOffset + 4;
  }
  return false;
}

function hasValidJpegStructure(bytes: Uint8Array) {
  if (!bytesMatch(bytes, [255, 216]) || !bytesMatch(bytes, [255, 217], bytes.length - 2)) return false;
  let hasFrame = false;
  let hasScan = false;
  for (let offset = 2; offset + 4 < bytes.length; offset += 1) {
    if (bytes[offset] !== 255 || bytes[offset + 1] === 0 || bytes[offset + 1] === 255) continue;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) continue;
    const isFrame = (marker >= 192 && marker <= 195) || (marker >= 197 && marker <= 199) || (marker >= 201 && marker <= 203) || (marker >= 205 && marker <= 207);
    if (isFrame && length >= 8 && ((bytes[offset + 5] << 8) | bytes[offset + 6]) > 0 && ((bytes[offset + 7] << 8) | bytes[offset + 8]) > 0) hasFrame = true;
    if (marker === 218 && length >= 8) hasScan = true;
  }
  return hasFrame && hasScan;
}

function hasValidWebpStructure(bytes: Uint8Array) {
  if (!bytesMatch(bytes, [82, 73, 70, 70]) || !bytesMatch(bytes, [87, 69, 66, 80], 8)) return false;
  if (littleEndianUint32(bytes, 4) !== bytes.length - 8) return false;
  let offset = 12;
  let hasImageChunk = false;
  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(...bytes.slice(offset, offset + 4));
    const length = littleEndianUint32(bytes, offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > bytes.length) return false;
    if (type === "VP8 ") hasImageChunk ||= length >= 10 && bytesMatch(bytes, [157, 1, 42], dataStart + 3);
    if (type === "VP8L") hasImageChunk ||= length >= 5 && bytes[dataStart] === 47;
    if (type === "VP8X") hasImageChunk ||= length >= 10;
    offset = dataEnd + (length % 2);
  }
  return offset === bytes.length && hasImageChunk;
}

export function detectImageContentType(bytes: Uint8Array): MediaContentType | null {
  if (bytesMatch(bytes, [137, 80, 78, 71, 13, 10, 26, 10])) return "image/png";
  if (bytesMatch(bytes, [255, 216])) return "image/jpeg";
  if (bytesMatch(bytes, [82, 73, 70, 70]) && bytesMatch(bytes, [87, 69, 66, 80], 8)) return "image/webp";
  return null;
}

function hasValidImageStructure(contentType: MediaContentType, bytes: Uint8Array) {
  if (contentType === "image/png") return hasValidPngStructure(bytes);
  if (contentType === "image/jpeg") return hasValidJpegStructure(bytes);
  return hasValidWebpStructure(bytes);
}

export function validateVerifiedImage({
  declaredContentType,
  objectContentType,
  objectSize,
  maxBytes,
  bytes,
}: VerificationInput): VerificationResult {
  if (!Number.isSafeInteger(objectSize) || objectSize <= 0 || objectSize > maxBytes || bytes.length !== objectSize) {
    return { error: "The uploaded image exceeds the allowed size." };
  }
  const detectedContentType = detectImageContentType(bytes);
  if (
    !detectedContentType ||
    detectedContentType !== declaredContentType ||
    objectContentType?.toLowerCase().split(";", 1)[0] !== detectedContentType ||
    !hasValidImageStructure(detectedContentType, bytes)
  ) {
    return { error: "The uploaded file is not a supported image." };
  }
  return { contentType: detectedContentType };
}
