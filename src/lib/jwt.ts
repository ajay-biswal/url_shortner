import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser } from "../types/auth.js";

interface JwtPayload extends AuthUser {
  exp: number;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured and at least 32 characters long");
  }

  return secret;
}

export function createAccessToken(user: AuthUser): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      userId: user.userId,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    } satisfies JwtPayload),
  );

  const unsignedToken = `${header}.${payload}`;
  const signature = sign(unsignedToken, getSecret());

  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token: string): AuthUser {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid token");
  }

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`, getSecret());

  const actual = Buffer.from(signature, "base64url");
  const expected = Buffer.from(expectedSignature, "base64url");

  if (
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  ) {
    throw new Error("Invalid token");
  }

  const decoded = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as JwtPayload;

  if (
    typeof decoded.userId !== "string" ||
    typeof decoded.email !== "string" ||
    typeof decoded.exp !== "number" ||
    decoded.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Expired or invalid token");
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
  };
}
