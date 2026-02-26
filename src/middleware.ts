import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Routes that REQUIRE authentication (write-actions only) */
const protectedPaths = [
  "/settings",
  "/alerts/new",
  "/alerts/rules",
];

/** Routes only accessible when NOT authenticated */
const authPaths = ["/login", "/register"];

function isProtectedRoute(pathname: string) {
  return protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAuthRoute(pathname: string) {
  return authPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Skip Supabase auth if env vars are not configured
  if (
    !supabaseUrl ||
    supabaseUrl.includes("your-project") ||
    supabaseUrl === "your_supabase_url"
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session + get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected route → redirect to /login if not authenticated
  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Auth route → redirect to /dashboard if already authenticated
  if (isAuthRoute(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/radar";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
