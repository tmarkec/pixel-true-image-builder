export function activeListingCounts(listings: readonly { listing_type: string; status: string; expires_at: string }[], now = Date.now()) {
  const active = listings.filter((listing) => listing.status === "active" && Date.parse(listing.expires_at) > now);
  return {
    have: active.filter((listing) => listing.listing_type === "have").length,
    want: active.filter((listing) => listing.listing_type === "want").length,
  };
}