import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/env";

export const supabase = createBrowserClient(getSupabaseUrl(), getSupabaseKey());
