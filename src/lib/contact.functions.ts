import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ADMIN_EMAILS } from "@/config/oarOptions";
import { isAdminEmail } from "@/lib/listing-management";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Name must be under 100 characters."),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  message: z.string().trim().min(1, "Enter a message.").max(2000, "Message must be under 2000 characters."),
});

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator(contactSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert(data);
    if (error) throw new Error("Your message could not be sent. Try again.");
    return { ok: true };
  });

async function assertAdmin(supabase: { auth: { getUser: () => Promise<{ data: { user: { email?: string | null; email_confirmed_at?: string | null } | null }; error: unknown }> } }) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email_confirmed_at || !isAdminEmail(data.user.email ?? undefined, ADMIN_EMAILS)) throw new Error("This page is only available to admins.");
}

export const getContactMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Messages could not be loaded. Try again.");
    return data ?? [];
  });

export const deleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error("The message could not be deleted.");
    return { ok: true };
  });
