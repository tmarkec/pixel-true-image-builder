import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Public columns only. Contact details are never fetched here.
const PUBLIC_COLUMNS =
  "id, listing_type, brand, discipline, side, quantity, blade_type, shaft_type, shaft_softness, handle_type, sleeve_type, grip_type, length, condition, offer_type, county, club_name, pickup_event, image_url, notes, status, expires_at, created_at, updated_at";

export type ListingFilters = {
  type?: string | undefined;
  brand?: string | undefined;
  discipline?: string | undefined;
  side?: string | undefined;
  county?: string | undefined;
};

export const listingsQuery = (f: ListingFilters) =>
  queryOptions({
    queryKey: ["listings", f],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select(PUBLIC_COLUMNS)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("updated_at", { ascending: false })
        .limit(200);
      if (f.type) q = q.eq("listing_type", f.type);
      if (f.brand) q = q.eq("brand", f.brand);
      if (f.discipline) q = q.eq("discipline", f.discipline);
      if (f.side) q = q.eq("side", f.side);
      if (f.county) q = q.eq("county", f.county);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

export const listingQuery = (id: string) =>
  queryOptions({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select(PUBLIC_COLUMNS).eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

export function sideLabel(side: string) {
  return side === "Unspecified / Either" ? "Either" : side;
}

const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
export function relativeTime(iso: string, now = Date.now()) {
  const secs = Math.round((new Date(iso).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [u, s] of units) if (Math.abs(secs) >= s) return rtf.format(Math.round(secs / s), u);
  return "just now";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB");
}
