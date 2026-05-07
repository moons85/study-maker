import { createClient } from "@supabase/supabase-js";

import { getRequiredEnv } from "@/lib/env";
import { normalizeSupabaseUrl } from "@/lib/supabase/url";

export function getSupabaseAdmin() {
  return createClient(
    normalizeSupabaseUrl(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
