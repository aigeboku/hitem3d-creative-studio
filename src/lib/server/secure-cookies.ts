import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const HITEM3D_CREDENTIALS_COOKIE = "hitem3d_credentials";
const HITEM3D_TOKEN_COOKIE = "hitem3d_token";
const GEMINI_KEY_COOKIE = "gemini_api_key";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface Hitem3dCredentials {
  username: string;
  password: string;
}

export interface Hitem3dToken {
  token: string;
  expiresAt: number;
}

interface GeminiCredentials {
  apiKey: string;
}

export function getHitem3dCredentials(
  request: NextRequest
): Hitem3dCredentials | null {
  return readEncryptedCookie<Hitem3dCredentials>(
    request,
    HITEM3D_CREDENTIALS_COOKIE
  );
}

export function setHitem3dCredentials(
  response: NextResponse,
  credentials: Hitem3dCredentials
): void {
  writeEncryptedCookie(
    response,
    HITEM3D_CREDENTIALS_COOKIE,
    credentials,
    COOKIE_MAX_AGE_SECONDS
  );
}

export function clearHitem3dCredentials(response: NextResponse): void {
  response.cookies.delete({
    name: HITEM3D_CREDENTIALS_COOKIE,
    path: "/",
  });
}

export function getHitem3dToken(request: NextRequest): Hitem3dToken | null {
  return readEncryptedCookie<Hitem3dToken>(request, HITEM3D_TOKEN_COOKIE);
}

export function setHitem3dToken(
  response: NextResponse,
  token: Hitem3dToken
): void {
  const maxAge = Math.max(
    60,
    Math.floor((token.expiresAt - Date.now()) / 1000)
  );
  writeEncryptedCookie(response, HITEM3D_TOKEN_COOKIE, token, maxAge);
}

export function clearHitem3dToken(response: NextResponse): void {
  response.cookies.delete({
    name: HITEM3D_TOKEN_COOKIE,
    path: "/",
  });
}

export function getGeminiApiKey(request: NextRequest): string | null {
  const payload = readEncryptedCookie<GeminiCredentials>(request, GEMINI_KEY_COOKIE);
  return payload?.apiKey || null;
}

export function setGeminiApiKey(response: NextResponse, apiKey: string): void {
  writeEncryptedCookie(
    response,
    GEMINI_KEY_COOKIE,
    { apiKey },
    COOKIE_MAX_AGE_SECONDS
  );
}

export function clearGeminiApiKey(response: NextResponse): void {
  response.cookies.delete({
    name: GEMINI_KEY_COOKIE,
    path: "/",
  });
}

export function hasHitem3dCredentials(request: NextRequest): boolean {
  return !!getHitem3dCredentials(request);
}

export function hasGeminiApiKey(request: NextRequest): boolean {
  return !!getGeminiApiKey(request);
}

function readEncryptedCookie<T>(request: NextRequest, name: string): T | null {
  const rawValue = request.cookies.get(name)?.value;
  if (!rawValue) return null;

  try {
    const json = decrypt(rawValue);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function writeEncryptedCookie(
  response: NextResponse,
  name: string,
  payload: unknown,
  maxAge: number
): void {
  const serialized = JSON.stringify(payload);
  const encrypted = encrypt(serialized);

  response.cookies.set({
    name,
    value: encrypted,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

function encrypt(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decrypt(payload: string): string | null {
  const [ivB64, tagB64, encryptedB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !encryptedB64) return null;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivB64, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function getEncryptionKey(): Buffer {
  const secret =
    process.env.CREDENTIALS_COOKIE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "";

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CREDENTIALS_COOKIE_SECRET is required in production.");
    }

    return createHash("sha256")
      .update("hitem3d-creative-studio-dev-only-secret")
      .digest();
  }

  return createHash("sha256").update(secret).digest();
}
