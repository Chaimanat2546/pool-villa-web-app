import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCredentials } from "@/lib/supabase/env";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  return createBrowserClient(supabaseUrl, supabaseKey);
}
