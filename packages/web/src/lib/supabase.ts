import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (browser) — usa cookies para que o middleware server-side leia a sessão
export const supabase = createBrowserClient(url, anonKey);

// Server-side (Server Components, middleware)
export function createServerSupabase(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });
}
