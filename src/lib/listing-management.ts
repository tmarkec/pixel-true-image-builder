import { EXPIRY_WARNING_DAYS, LISTING_DAYS } from "@/config/oarOptions";

export function listingState(status: string, expiresAt: string, now = Date.now()) {
  const days = Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 86400000));
  const label = status === "hidden" ? "Hidden" : status === "matched" ? "Matched" : status === "archived" ? "Archived" : days === 0 ? "Expired" : "Active";
  return { label, days, urgent: label === "Active" && days < EXPIRY_WARNING_DAYS };
}

export function renewedExpiry(now = Date.now()) {
  return new Date(now + LISTING_DAYS * 86400000).toISOString();
}

export function isAdminEmail(email: string | undefined, allowed: readonly string[]) {
  return !!email && allowed.some((value) => value.toLowerCase() === email.toLowerCase());
}