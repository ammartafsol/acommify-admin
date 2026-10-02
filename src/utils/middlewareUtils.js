// Enhanced middleware utilities for permission checking

/**
 * Decrypt token if it's encrypted (matching the encryption used in login)
 */
export const decryptToken = (encryptedToken) => {
  try {
    // This should match the decryption logic from your interceptor/encryption.js
    // For now, return the token as-is assuming it might not be encrypted in middleware
    return encryptedToken;
  } catch (error) {
    console.error("Error decrypting token:", error);
    return null;
  }
};

/**
 * Enhanced JWT decoder with error handling
 */
export const decodeJWTSafely = (token) => {
  try {
    // First try to decrypt if encrypted
    const decryptedToken = decryptToken(token);
    if (!decryptedToken) return null;

    // Split JWT into parts
    const parts = decryptedToken.split(".");
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if necessary
    const padded = base64 + "===".slice(0, (4 - (base64.length % 4)) % 4);

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const decoded = JSON.parse(jsonPayload);

    // Validate required fields
    if (!decoded.exp || !decoded.iat) {
      console.warn("JWT missing required fields (exp, iat)");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

/**
 * Check if JWT token is expired with buffer time
 */
export const isJWTExpired = (token, bufferSeconds = 60) => {
  try {
    const decoded = decodeJWTSafely(token);
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp - bufferSeconds; // Add buffer for network delays

    return currentTime >= expirationTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Extract user info from JWT token
 */
export const extractUserFromJWT = (token) => {
  try {
    const decoded = decodeJWTSafely(token);
    if (!decoded) return null;

    return {
      id: decoded.sub || decoded.userId || decoded.id,
      name: decoded.name || decoded.full_name || decoded.username,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch (error) {
    console.error("Error extracting user from JWT:", error);
    return null;
  }
};

/**
 * Validate route pattern matching
 */
export const matchesRoutePattern = (pathname, pattern) => {
  // Convert pattern to regex (e.g., "/users/:id" becomes "/users/[^/]+")
  const regexPattern = pattern
    .replace(/:[^/]+/g, "[^/]+") // Replace :id with regex
    .replace(/\*/g, ".*"); // Replace * with regex

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
};

/**
 * Get route permissions with dynamic route support
 */
export const getRoutePermissionsAdvanced = (pathname, routePermissions) => {
  // First try exact match
  if (routePermissions[pathname]) {
    return routePermissions[pathname];
  }

  // Try pattern matching for dynamic routes
  for (const [pattern, permissions] of Object.entries(routePermissions)) {
    if (pattern.includes(":") || pattern.includes("*")) {
      if (matchesRoutePattern(pathname, pattern)) {
        return permissions;
      }
    }
  }

  return [];
};

/**
 * Enhanced permission checking with role hierarchy
 */
export const hasPermissionAdvanced = (
  userPermissions,
  userRole,
  requiredPermissions,
  roleHierarchy = {}
) => {
  // No permissions required
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // No user permissions
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Check direct permission match
  const hasDirectPermission = requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );

  if (hasDirectPermission) {
    return true;
  }

  // Check role hierarchy (if a higher role has the permission)
  if (userRole && roleHierarchy[userRole]) {
    const userRoleLevel = roleHierarchy[userRole];

    // If user is admin level or above, grant access
    if (userRoleLevel >= 9) {
      // 9 = admin level
      return true;
    }
  }

  return false;
};

/**
 * Create comprehensive access log
 */
export const createAccessLog = (
  pathname,
  userInfo,
  hasAccess,
  requiredPermissions,
  reason = ""
) => {
  if (process.env.NODE_ENV !== "development") return;

  const timestamp = new Date().toISOString();
  const status = hasAccess ? "✅ ALLOWED" : "❌ DENIED";

  // Use regular console.log instead of console.group for compatibility
  console.log(`🔐 ${status} - ${timestamp}`);
  console.log(`  📍 Route: ${pathname}`);
  console.log(
    `  👤 User: ${userInfo?.name || "Unknown"} (${
      userInfo?.email || "No email"
    })`
  );
  console.log(`  🎭 Role: ${userInfo?.role || "none"}`);
  console.log(`  🔑 Required: [${requiredPermissions.join(", ")}]`);
  console.log(
    `  ✅ User Permissions: [${userInfo?.permissions?.join(", ") || "none"}]`
  );

  if (!hasAccess && reason) {
    console.log(`  ❌ Reason: ${reason}`);
  }

  console.log(""); // Empty line for separation
};

/**
 * Check if user can access admin features
 */
export const isAdminUser = (role) => {
  return ["admin"].includes(role);
};

/**
 * Check if user has management privileges
 */
export const isManagerUser = (role) => {
  return ["business-owner", "admin"].includes(role);
};

/**
 * Get user's access level
 */
export const getUserAccessLevel = (role) => {
  const levels = {
    super_admin: 10,
    admin: 9,
    manager: 8,
    editor: 7,
    viewer: 6,
    staff: 5,
    maintenance_staff: 4,
    receptionist: 3,
  };

  return levels[role] || 0;
};

export default {
  decryptToken,
  decodeJWTSafely,
  isJWTExpired,
  extractUserFromJWT,
  matchesRoutePattern,
  getRoutePermissionsAdvanced,
  hasPermissionAdvanced,
  createAccessLog,
  isAdminUser,
  isManagerUser,
  getUserAccessLevel,
};
