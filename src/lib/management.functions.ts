import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { renewedExpiry } from "@/lib/listing-management";
import { assertAdmin } from "@/lib/admin-access";
import { attachReporterEmails } from "@/lib/reporters";

export const getOwnListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("listings")
      .select("id, listing_type, quantity, brand, discipline, side, county, status, expires_at, created_at")
      .eq("user_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error("Your listings could not be loaded. Try again.");
    return data ?? [];
  });

export const updateOwnListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), action: z.enum(["matched", "archived", "renew", "delete"]) }))
  .handler(async ({ context, data }) => {
    const { data: listing, error: readError } = await context.supabase.from("listings")
      .select("id, status").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (readError || !listing) throw new Error("This listing is no longer available.");
    if (listing.status === "hidden" && data.action !== "delete") throw new Error("Only an admin can restore a hidden listing.");
    const result = data.action === "delete"
      ? await context.supabase.from("listings").delete().eq("id", data.id).eq("user_id", context.userId).select("id")
      : await context.supabase.from("listings").update(data.action === "renew" ? { status: "active", expires_at: renewedExpiry() } : { status: data.action })
          .eq("id", data.id).eq("user_id", context.userId).select("id");
    if (result.error) throw new Error(result.error.message);
    if (!result.data?.length) throw new Error("This listing is no longer available.");
    return { ok: true };
  });

export const getModeration = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("reports")
      .select("id, reason, created_at, listing_id, reporter_id, listings(id, listing_type, brand, quantity, discipline, side, county, status, expires_at, created_at, notes, image_url)")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Reported listings could not be loaded. Try again.");
    return attachReporterEmails(data ?? [], async (id) => {
      const { data: account, error: accountError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (accountError) return null;
      return account.user?.email ?? null;
    });
  });

export const moderateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), action: z.enum(["hide", "restore", "delete"]) }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: listing, error: readError } = await supabaseAdmin.from("listings")
      .select("status, moderation_previous_status").eq("id", data.id).maybeSingle();
    if (readError || !listing) throw new Error("This listing is no longer available.");
    if (data.action === "hide" && listing.status === "hidden") return { ok: true };
    if (data.action === "restore" && listing.status !== "hidden") return { ok: true };
    const result = data.action === "delete"
      ? await supabaseAdmin.from("listings").delete().eq("id", data.id).select("id")
      : await supabaseAdmin.from("listings").update(data.action === "hide"
          ? { status: "hidden", moderation_previous_status: listing.status }
          : { status: listing.moderation_previous_status ?? "active", moderation_previous_status: null })
          .eq("id", data.id).select("id");
    if (result.error) throw new Error(result.error.message);
    if (!result.data?.length) throw new Error("This listing is no longer available.");
    return { ok: true };
  });