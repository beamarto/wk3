import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
      const cookieStore = await cookies();
      const supabase = createServerClient(getSupabaseUrl(), getSupabaseKey(), {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.delete({ name, ...options });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const forwardedHost = request.headers.get("x-forwarded-host");
        const host = forwardedHost ?? new URL(request.url).host;
        const protocol =
          host.includes("localhost") || host.startsWith("127.0.0.1")
            ? "http"
            : "https";
        return NextResponse.redirect(`${protocol}://${host}${next}`);
      }
    }
  } catch (err) {
    console.error("Callback Crash:", err);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
