import crypto from "node:crypto";
import { generateURI, verifySync } from "otplib";

function toBase32(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (let index = 0; index < buffer.length; index += 1) {
    const byte = buffer[index];
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

export function getAdminTotpSecret(): string {
  const configured = process.env.ADMIN_TOTP_SECRET?.trim();
  if (configured) return configured;
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET manquant pour initialiser la 2FA admin");
  return toBase32(crypto.createHash("sha256").update(`wapigarage-admin-totp:${jwtSecret}`).digest().subarray(0, 20));
}

export function getAdminTotpUri(email: string): string {
  return generateURI({ issuer: "WapiGarage", label: email, secret: getAdminTotpSecret(), algorithm: "sha1", digits: 6, period: 30 });
}

export function verifyAdminTotp(token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  return verifySync({ secret: getAdminTotpSecret(), token, epochTolerance: 1 }).valid;
}
