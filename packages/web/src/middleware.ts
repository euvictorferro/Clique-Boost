import { NextResponse, type NextRequest } from "next/server";

// Auth desativado temporariamente — foco no desenvolvimento da parte interna.
// Para reativar: restaurar verificação de sessão Supabase e redirects por role.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
