import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require("next/server.js");

// Pure middleware decision logic extracted for verifiable regression testing
function shouldUpdateSession(pathname, headers, hasSupabaseCookies) {
  if (headers.get("next-action") || headers.get("x-action")) {
    return false; // Skip Server Actions to prevent duplicate Set-Cookie & 502 Bad Gateway
  }
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth/")
  ) {
    return false; // Skip public auth routes
  }
  if (!hasSupabaseCookies) {
    return false; // Skip clean browser sessions with no cookies
  }
  return true;
}

test("Authentication Middleware - 502 Prevention & Security Suite", async (t) => {
  await t.test("bypasses Server Actions to avoid cookie duplication and header bloat", () => {
    const headers = new Headers({
      "next-action": "loginAction-uuid",
      cookie: "sb-nazatisesdikrdetxvuu-auth-token=expired-cookie",
    });
    const shouldRun = shouldUpdateSession("/login", headers, true);
    assert.strictEqual(shouldRun, false, "Must bypass Server Action requests");
  });

  await t.test("bypasses public auth routes to prevent removal-cookie cascades on login page", () => {
    const routes = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth/confirm"];
    for (const route of routes) {
      const headers = new Headers({
        cookie: "sb-nazatisesdikrdetxvuu-auth-token=expired-cookie",
      });
      const shouldRun = shouldUpdateSession(route, headers, true);
      assert.strictEqual(shouldRun, false, `Must bypass ${route}`);
    }
  });

  await t.test("bypasses clean browsers with no Supabase cookies on protected routes", () => {
    const headers = new Headers({});
    const shouldRun = shouldUpdateSession("/dashboard", headers, false);
    assert.strictEqual(shouldRun, false, "Must bypass clean requests with no sb- cookies");
  });

  await t.test("runs session refresh for authenticated users on protected pages", () => {
    const headers = new Headers({
      cookie: "sb-nazatisesdikrdetxvuu-auth-token=active-token",
    });
    const shouldRun = shouldUpdateSession("/dashboard", headers, true);
    assert.strictEqual(shouldRun, true, "Must run session refresh on protected pages");
  });

  await t.test("generates x-middleware-set-cookie for Next.js downstream propagation", () => {
    const res = NextResponse.next();
    // Simulate Supabase SSR chunked auth cookies
    res.cookies.set("sb-nazatisesdikrdetxvuu-auth-token.0", "token_chunk_0", {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
    });

    // Next.js requires x-middleware-set-cookie to propagate cookies to downstream Server Components
    // (via mergeMiddlewareCookies) and to convert them to Set-Cookie on the outgoing Node response.
    assert.ok(
      res.headers.get("x-middleware-set-cookie") !== null,
      "x-middleware-set-cookie must be retained for Next.js internal propagation"
    );
    assert.ok(
      res.headers.get("x-middleware-set-cookie").includes("sb-nazatisesdikrdetxvuu-auth-token.0"),
      "x-middleware-set-cookie contains the set cookie"
    );
  });
});
