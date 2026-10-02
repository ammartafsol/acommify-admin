import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { ROUTE_PERMISSIONS } from "./constants/permissions";
import { routing } from "./i18n/routing";
import { isAdminUser } from "./utils/middlewareUtils";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/login/admin",
  "/login/nationwide-dashboard",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/terms",
  "/privacy",
  "/contact",
];

// Admin routes that require admin role specifically
const ADMIN_ONLY_ROUTES = ["/centres"];

// Function to check if route requires authentication
const requiresAuth = (pathname) => {
  const route = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return !PUBLIC_ROUTES.includes(route);
};

// Function to check if route requires admin access
const requiresAdmin = (pathname) => {
  const route = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  return ADMIN_ONLY_ROUTES.includes(route);
};

// Function to get required permissions for a route
const getRoutePermissions = (pathname) => {
  const route = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const perms = ROUTE_PERMISSIONS[route];
  if (!perms) return [];
  // If the permission is an array of arrays (e.g., [PERMISSIONS.TIME_SLOTS]), flatten it
  if (Array.isArray(perms) && perms.length === 1 && Array.isArray(perms[0])) {
    return perms[0];
  }
  return perms;
};

// Get user permissions from cookies and role
const getUserPermissions = (request) => {
  try {
    const encryptedToken = request.cookies.get("_xpdx_acom")?.value;
    const role = request.cookies.get("role")?.value;
    const userPermissions = request.cookies.get("user_permissions")?.value;

    if (!encryptedToken) return { permissions: [], role: null, user: null };

    // Use permissions from cookie if available
    if (userPermissions) {
      try {
        const parsedPermissions = JSON.parse(userPermissions);
        return {
          permissions: Array.isArray(parsedPermissions)
            ? parsedPermissions
            : [],
          role: role,
          user: { role: role },
        };
      } catch (e) {
        console.warn("Failed to parse permissions cookie:", e);
      }
    }

    return {
      permissions: [],
      role: role || null,
      user: { role: role },
    };
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return { permissions: [], role: null, user: null };
  }
};

// Check if user has required permissions
const hasPermission = (userPermissions, requiredPermissions) => {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;
  // If requiredPermissions contains arrays, flatten
  const flatRequired = requiredPermissions.flat();
  return flatRequired.some((permission) =>
    userPermissions.includes(permission),
  );
};

// Log access attempts for debugging
const logAccess = (
  pathname,
  userRole,
  hasAccess,
  requiredPermissions,
  user = null,
) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Access Control] ${new Date().toISOString()}`);
    console.log(`Route: ${pathname}`);
    console.log(
      `User: ${user?.name || "Unknown"} (Role: ${userRole || "None"})`,
    );
    console.log(`Required: [${requiredPermissions.join(", ")}]`);
    console.log(`Access ${hasAccess ? "GRANTED" : "DENIED"}`);
    console.log("---");
  }
};

export default function proxy(request) {
  const { pathname } = request.nextUrl;
  const intlResponse = intlMiddleware(request);
  // return intlResponse;

  // Skip permission checks for API routes, static files, and special paths
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/public")
  ) {
    return intlResponse;
  }

  // Check if route requires authentication
  if (requiresAuth(pathname)) {
    const encryptedToken = request.cookies.get("_xpdx_acom")?.value;

    if (!encryptedToken) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const {
      permissions: userPermissions,
      role: userRole,
      user,
    } = getUserPermissions(request);
    const requiredPermissions = getRoutePermissions(pathname);

    // Check admin-only routes
    if (requiresAdmin(pathname)) {
      if (!isAdminUser(userRole)) {
        logAccess(pathname, userRole, false, ["admin-access"], user);
        const accessDeniedUrl = new URL("/en/access-denied", request.url);
        accessDeniedUrl.searchParams.set("reason", "admin_required");
        return NextResponse.redirect(accessDeniedUrl);
      }
    }

    // Check route permissions
    if (requiredPermissions.length > 0) {
      const hasAccess =
        isAdminUser(userRole) ||
        hasPermission(userPermissions, requiredPermissions);
      logAccess(pathname, userRole, hasAccess, requiredPermissions, user);

      if (!hasAccess) {
        const errorUrl = new URL("/en/access-denied", request.url);
        if (process.env.NODE_ENV === "development") {
          errorUrl.searchParams.set("route", pathname);
          errorUrl.searchParams.set("required", requiredPermissions.join(","));
          errorUrl.searchParams.set("user_role", userRole || "none");
          errorUrl.searchParams.set(
            "user_permissions",
            userPermissions.join(","),
          );
        }
        return NextResponse.redirect(errorUrl);
      }
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|.*\\..*).*)",
  ],
};
