import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const getAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (browser) — lazy para evitar erro de build sem env vars
let _supabase: ReturnType<typeof createBrowserClient> | null = null;
export const getSupabaseBrowserClient = () => {
  if (!_supabase) _supabase = createBrowserClient(getUrl(), getAnonKey());
  return _supabase;
};
/** @deprecated use getSupabaseBrowserClient() */
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    return (getSupabaseBrowserClient() as Record<string | symbol, unknown>)[prop];
  },
});

// Server-side (Server Components, middleware)
export function createServerSupabase(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(getUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });
}
