import { describe, expect, it } from "vitest";
import {
  validateVerifiedImage,
  type MediaContentType,
} from "../../../supabase/functions/_shared/imageValidation";

function bytes(base64: string) {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

const images: Record<MediaContentType, Uint8Array> = {
  "image/png": bytes("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAADUExURf8AABniCTcAAAAHdElNRQfqCRMLHAtJR2NwAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI2LTA5LTE5VDExOjI4OjExKzAwOjAwmwyu3gAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNi0wOS0xOVQxMToyODoxMSswMDowMOpRFmIAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjYtMDktMTlUMTE6Mjg6MTErMDA6MDC9RDe9AAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg=="),
  "image/jpeg": bytes("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAVAQEBAAAAAAAAAAAAAAAAAAAHCf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ADoDFU3/2Q=="),
  "image/webp": bytes("UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAgA0JaACdLoB+AADsAD+8MQL/yC5YXXI1/8gP+QH/ID/+PIAAAA="),
};

function verify(contentType: MediaContentType, value = images[contentType]) {
  return validateVerifiedImage({
    declaredContentType: contentType,
    objectContentType: contentType,
    objectSize: value.length,
    maxBytes: 5 * 1024 * 1024,
    bytes: value,
  });
}

describe("validateVerifiedImage", () => {
  it.each(Object.keys(images) as MediaContentType[])("accepts a valid %s object", (contentType) => {
    expect(verify(contentType)).toEqual({ contentType });
  });

  it("rejects non-image bytes declared as PNG", () => {
    expect(verify("image/png", new TextEncoder().encode("#!/bin/sh\necho not-an-image"))).toEqual({
      error: "The uploaded file is not a supported image.",
    });
  });

  it("rejects image bytes when the declared type does not match", () => {
    expect(validateVerifiedImage({
      declaredContentType: "image/png",
      objectContentType: "image/png",
      objectSize: images["image/jpeg"].length,
      maxBytes: 5 * 1024 * 1024,
      bytes: images["image/jpeg"],
    })).toEqual({ error: "The uploaded file is not a supported image." });
  });

  it("rejects an object larger than its server-side target limit", () => {
    expect(validateVerifiedImage({
      declaredContentType: "image/webp",
      objectContentType: "image/webp",
      objectSize: 5 * 1024 * 1024 + 1,
      maxBytes: 5 * 1024 * 1024,
      bytes: new Uint8Array(5 * 1024 * 1024 + 1),
    })).toEqual({ error: "The uploaded image exceeds the allowed size." });
  });

  it("rejects unsupported formats and malformed image containers", () => {
    expect(verify("image.png" as MediaContentType, new Uint8Array([71, 73, 70, 56, 57, 97]))).toEqual({
      error: "The uploaded file is not a supported image.",
    });
    expect(verify("image/png", images["image/png"].slice(0, -1))).toEqual({
      error: "The uploaded file is not a supported image.",
    });
    expect(verify("image/jpeg", images["image/jpeg"].slice(0, -2))).toEqual({
      error: "The uploaded file is not a supported image.",
    });
    expect(verify("image/webp", images["image/webp"].slice(0, -1))).toEqual({
      error: "The uploaded file is not a supported image.",
    });
  });
});
