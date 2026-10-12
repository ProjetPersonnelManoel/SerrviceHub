import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Vérification "optimiste" : on regarde seulement si le cookie existe.
// La vraie validation du JWT est faite par le backend (getCurrentUser dans les pages).
export function proxy(request: NextRequest) {
  if (!request.cookies.has("token")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// Routes réservées aux utilisateurs connectés
export const config = {
  matcher: ["/dashboard/:path*"],
};
