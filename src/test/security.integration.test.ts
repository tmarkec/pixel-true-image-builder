import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { assertAdmin } from "@/lib/admin-access";
import type { Database } from "@/integrations/supabase/types";

const url = process.env["SUPABASE_URL"];
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
function client(k: string) {
  return createClient<Database>(url ?? "http://localhost", k, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (k.startsWith("sb_") && headers.get("Authorization") === `Bearer ${k}`) headers.delete("Authorization");
      headers.set("apikey", k);
      return fetch(input, { ...init, headers });
    } },
  });
}

describe.skipIf(!url || !key || !publishable)("Security rules against the database", () => {
  it("enforces contact visibility, protected roles, photo restrictions, text bounds and duplicate reports", async () => {
    if (!key || !publishable) return;
    const admin = client(key);
    const ids: string[] = [];
    const memberClients: ReturnType<typeof client>[] = [];
    try {
      for (let n = 0; n < 2; n++) {
        const email = `security-${crypto.randomUUID()}@example.com`;
        const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
        expect(error).toBeNull();
        if (!data.user) throw new Error("Test member missing");
        ids.push(data.user.id);
        const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
        if (!link.data.properties) throw new Error("Test session missing");
        const member = client(publishable);
        const session = await member.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
        expect(session.error).toBeNull();
        memberClients.push(member);
      }
      const owner = memberClients[0];
      const viewer = memberClients[1];
      const ownerId = ids[0];
      const viewerId = ids[1];
      if (!owner || !viewer || !ownerId || !viewerId) throw new Error("Test members missing");
      const base = { user_id: ownerId, listing_type: "have", brand: "Other", discipline: "Sweep", side: "Bow", county: "Dublin" };
      const rows = await admin.from("listings").insert(Array.from({ length: 4 }, () => base)).select("id");
      expect(rows.error).toBeNull();
      const [active, hidden, archived, expired] = rows.data ?? [];
      if (!active || !hidden || !archived || !expired) throw new Error("Test listings missing");
      expect((await admin.from("listings").update({ status: "hidden" }).eq("id", hidden.id)).error).toBeNull();
      expect((await admin.from("listings").update({ status: "archived" }).eq("id", archived.id)).error).toBeNull();
      expect((await admin.from("listings").update({ expires_at: "2020-01-01T00:00:00Z" }).eq("id", expired.id)).error).toBeNull();
      const listingIds = [active.id, hidden.id, archived.id, expired.id];
      const visible = await viewer.from("listing_contacts").select("listing_id").in("listing_id", listingIds);
      expect(visible.error).toBeNull();
      expect(visible.data?.map(r => r.listing_id)).toEqual([active.id]);
      expect((await owner.from("listing_contacts").select("listing_id").in("listing_id", listingIds)).data).toHaveLength(4);
      const guest = client(publishable);
      expect((await guest.from("listing_contacts").select("listing_id").in("listing_id", listingIds)).data ?? []).toHaveLength(0);

      await expect(assertAdmin(viewer)).rejects.toThrow("only available to admins");
      expect((await viewer.from("user_roles").insert({ user_id: viewerId, role: "admin" })).error).not.toBeNull();
      expect((await admin.from("user_roles").insert({ user_id: ownerId, role: "admin" })).error).toBeNull();
      await expect(assertAdmin(owner)).resolves.toBeUndefined();
      expect((await viewer.from("user_roles").select("user_id").eq("user_id", ownerId)).data).toEqual([]);

      expect((await owner.from("listings").update({ image_url: "https://tracker.example/photo.jpg" }).eq("id", active.id)).error?.code).toBe("23514");
      const ownUrl = `${url}/storage/v1/object/public/oar-photos/${ownerId}/test.png`;
      expect((await owner.from("listings").update({ image_url: ownUrl }).eq("id", active.id)).error).toBeNull();
      for (const [field, max] of [["notes", 1000], ["club_name", 120], ["pickup_event", 200]] as const) {
        const tooLong: Database["public"]["Tables"]["listings"]["Update"] = {};
        tooLong[field] = "x".repeat(max + 1);
        const allowed: Database["public"]["Tables"]["listings"]["Update"] = {};
        allowed[field] = "x".repeat(max);
        expect((await owner.from("listings").update(tooLong).eq("id", active.id)).error?.code).toBe("23514");
        expect((await owner.from("listings").update(allowed).eq("id", active.id)).error).toBeNull();
      }
      expect((await owner.from("listing_contacts").update({ phone: "malformed" }).eq("listing_id", active.id)).error?.code).toBe("23514");
      expect((await owner.from("listing_contacts").update({ phone: "087 123 4567" }).eq("listing_id", active.id)).error).toBeNull();
      const report = { listing_id: active.id, reporter_id: viewerId, reason: "Wrong details" };
      expect((await viewer.from("reports").insert(report)).error).toBeNull();
      expect((await viewer.from("reports").insert(report)).error?.code).toBe("23505");

      const bucket = await admin.storage.getBucket("oar-photos");
      expect(bucket.data?.file_size_limit).toBe(5242880);
      expect(bucket.data?.allowed_mime_types).toEqual(["image/png", "image/jpeg"]);
      expect((await owner.storage.from("oar-photos").upload(`${ownerId}/oversized.png`, new Uint8Array(5242881), { contentType: "image/png" })).error).not.toBeNull();
      expect((await owner.storage.from("oar-photos").upload(`${ownerId}/wrong-mime.jpg`, "not a photo", { contentType: "text/html" })).error).not.toBeNull();
      const path = `${ownerId}/security.png`;
      const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="), c => c.charCodeAt(0));
      expect((await owner.storage.from("oar-photos").upload(path, png, { contentType: "image/png" })).error).toBeNull();
      expect((await guest.storage.from("oar-photos").list(ownerId)).data ?? []).toEqual([]);
      const photoResponse = await fetch(admin.storage.from("oar-photos").getPublicUrl(path).data.publicUrl);
      expect(photoResponse.ok).toBe(true);
      expect((await admin.storage.from("oar-photos").remove([path])).error).toBeNull();
    } finally {
      for (const id of ids) {
        await admin.from("listings").delete().eq("user_id", id);
        await admin.from("listing_post_log").delete().eq("user_id", id);
        await admin.auth.admin.deleteUser(id);
      }
    }
  }, 60000);
});