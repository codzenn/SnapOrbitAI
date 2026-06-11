import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

const isRedirectIfSignedInRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
]);

const isPublicApiRoute = createRouteMatcher([
  "/api/videos",
  "/api/image-upload",
  "/api/auth/auto-logout",
  "/api/stripe/webhook",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);
  const isHomePage = currentUrl.pathname === "/home";
  const isApiRequest = currentUrl.pathname.startsWith("/api");

  if (userId && isRedirectIfSignedInRoute(req) && !isHomePage) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  //not logged in
  if (!userId) {
    if (!isPublicApiRoute(req) && !isPublicRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    if (isApiRequest && !isPublicApiRoute(req)) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
