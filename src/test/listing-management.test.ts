import { describe, expect, it } from "vitest";
import { MAX_ACTIVE_LISTINGS, MAX_DAILY_LISTINGS } from "@/config/oarOptions";
import { listingState, renewedExpiry } from "@/lib/listing-management";

const now = Date.parse("2026-10-22T15:00:00Z");
describe("Listing management rules", () => {
  it("renews for exactly 60 days", () => {
    expect(Date.parse(renewedExpiry(now)) - now).toBe(60 * 86400000);
  });
  it("shows expiry at the exact deadline", () => {
    expect(listingState("active", new Date(now).toISOString(), now).label).toBe("Expired");
  });
  it("warns only when fewer than seven days remain", () => {
    expect(listingState("active", new Date(now + 6 * 86400000).toISOString(), now).urgent).toBe(true);
    expect(listingState("active", new Date(now + 7 * 86400000).toISOString(), now).urgent).toBe(false);
  });
  it("keeps hidden listings hidden even after expiry", () => {
    expect(listingState("hidden", new Date(now - 1).toISOString(), now).label).toBe("Hidden");
  });
  it("sets the active listing limit to 20", () => expect(MAX_ACTIVE_LISTINGS).toBe(20));
  it("sets the daily posting limit to 10", () => expect(MAX_DAILY_LISTINGS).toBe(10));
});