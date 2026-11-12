import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/lib/admin-access";
import { confirmedContactEmail } from "@/lib/contact-access";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Name must be under 100 characters."),
  email: z.string().trim().email("Enter a valid email address.").max(255),
  message: z.string().trim().min(1, "Enter a message.").max(2000, "Message must be under 2000 characters."),
});

export const sendContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(contactSchema)
  .handler(async ({ data, context }) => {
    const { data: account, error: authError } = await context.supabase.auth.getUser();
    if (authError) throw new Error("Log in to send a message.");
    const email = confirmedContactEmail(account.user);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({ ...data, email });
    if (error) throw new Error("Your message could not be sent. Try again.");
    return { ok: true };
  });

export const getContactMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Messages could not be loaded. Try again.");
    return data ?? [];
  });

export const deleteContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error("The message could not be deleted.");
    return { ok: true };
  });
