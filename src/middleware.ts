import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.entries(routeAccessMap).map(
  ([route, allowedRoles]) => ({
    matcher: createRouteMatcher([route]),
    allowedRoles,
  })
);

export default clerkMiddleware(async (auth, req) => {
  // ✅ MUST be awaited
  const { userId, sessionClaims } = await auth();

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const pathname = req.nextUrl.pathname;

  for (const { matcher, allowedRoles } of matchers) {
    if (!matcher(req)) continue;

    // Not logged in
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Role not allowed
    if (!role || !allowedRoles.includes(role)) {
      const redirectTo = `/${role ?? "sign-in"}`;
      if (pathname !== redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
