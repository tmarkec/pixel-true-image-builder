import { expect, it } from "vitest";
import { activeListingCounts } from "@/lib/listing-reminder";

it("reminds members only about their active, unexpired spare and wanted listings", () => {
  const expires_at = "2026-12-12T00:00:00Z";
  expect(activeListingCounts([
    { listing_type: "have", status: "active", expires_at },
    { listing_type: "want", status: "active", expires_at },
    { listing_type: "have", status: "matched", expires_at },
    { listing_type: "have", status: "hidden", expires_at },
    { listing_type: "want", status: "active", expires_at: "2026-11-11T00:00:00Z" },
  ], Date.parse("2026-11-12T19:05:00Z"))).toEqual({ have: 1, want: 1 });
});