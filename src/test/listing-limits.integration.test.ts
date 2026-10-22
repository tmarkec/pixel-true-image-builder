import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Run against disposable, randomly owned rows only; never touches a real user's listings.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = url && key ? createClient(url, key, {
  auth: { persistSession: false },
  global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  } },
}) : null;

describe.skipIf(!db)("Database listing quotas", () => {
  it("rejects the eleventh daily post even after the first ten are deleted", async () => {
    if (!db) return;
    const userId = crypto.randomUUID();
    try {
      for (let n = 0; n < 10; n++) {
        const result = await db.from("listings").insert({ user_id: userId, listing_type: "have", brand: "Other", discipline: "Scull", side: "Bow", county: "Dublin", notes: "[VERIFICATION] Daily quota" }).select("id").single();
        expect(result.error).toBeNull();
        if (result.data) await db.from("listings").delete().eq("id", result.data.id);
      }
      const blocked = await db.from("listings").insert({ user_id: userId, listing_type: "have", brand: "Other", discipline: "Scull", side: "Bow", county: "Dublin" });
      expect(blocked.error?.message).toContain("no more than 10 new listings a day");
    } finally {
      await db.from("listings").delete().eq("user_id", userId);
      await db.from("listing_post_log").delete().eq("user_id", userId);
    }
  }, 30000);

  it("rejects a twenty-first active listing but allows one after archiving", async () => {
    if (!db) return;
    const userId = crypto.randomUUID();
    try {
      for (let n = 0; n < 20; n++) {
        if (n === 10) await db.from("listing_post_log").update({ posted_at: "2020-01-01T00:00:00Z" }).eq("user_id", userId);
        const result = await db.from("listings").insert({ user_id: userId, listing_type: "want", brand: "Other", discipline: "Sweep", side: "Stroke", county: "Cork", notes: "[VERIFICATION] Active quota" });
        expect(result.error).toBeNull();
      }
      await db.from("listing_post_log").update({ posted_at: "2020-01-01T00:00:00Z" }).eq("user_id", userId);
      const row = { user_id: userId, listing_type: "want", brand: "Other", discipline: "Sweep", side: "Stroke", county: "Cork" };
      const blocked = await db.from("listings").insert(row);
      expect(blocked.error?.message).toContain("no more than 20 active listings");
      const { data: existing } = await db.from("listings").select("id").eq("user_id", userId).limit(1).single();
      if (!existing) throw new Error("Test listing missing");
      await db.from("listings").update({ status: "archived" }).eq("id", existing.id);
      expect((await db.from("listings").insert(row)).error).toBeNull();
      const renewed = await db.from("listings").update({ status: "active" }).eq("id", existing.id);
      expect(renewed.error?.message).toContain("no more than 20 active listings");
    } finally {
      await db.from("listings").delete().eq("user_id", userId);
      await db.from("listing_post_log").delete().eq("user_id", userId);
    }
  }, 30000);
});