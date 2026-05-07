import { createClient } from "@supabase/supabase-js";

import { normalizeSupabaseUrl } from "@/lib/supabase/url";

export function getSupabaseBrowser() {
  return createClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  );
}
