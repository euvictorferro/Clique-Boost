import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/client/sign-in"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string })?.role;

  if (pathname.startsWith("/client")) {
    if (!user) return NextResponse.redirect(new URL("/client/sign-in", request.url));
    if (role !== "client" && role !== "agency") {
      return NextResponse.redirect(new URL("/client/sign-in", request.url));
    }
    return response;
  }

  // Rotas da agência
  if (!user) return NextResponse.redirect(new URL("/sign-in", request.url));
  if (role && role !== "agency") {
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
