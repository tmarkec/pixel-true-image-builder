import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function assertAdmin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email_confirmed_at) throw new Error("This page is only available to admins.");
  const { data: allowed, error: roleError } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  if (roleError || allowed !== true) throw new Error("This page is only available to admins.");
}