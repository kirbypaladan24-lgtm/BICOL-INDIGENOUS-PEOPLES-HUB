import { query } from "../config/db.js";
import { verifyFirebaseToken } from "../config/firebase-admin.js";
import { forbidden, serviceUnavailable, unauthorized } from "../utils/api-error.js";
import { hasRole } from "../utils/roles.js";

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function syncUserFromToken(decodedToken) {
  const email = decodedToken.email || `${decodedToken.uid}@firebase.local`;
  const displayName = decodedToken.name || decodedToken.displayName || null;
  const photoUrl = decodedToken.picture || null;
  const emailVerified = Boolean(decodedToken.email_verified);

  const result = await query(
    `
    INSERT INTO users (
      firebase_uid,
      email,
      display_name,
      photo_url,
      email_verified,
      last_login_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (firebase_uid)
    DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, users.display_name),
      photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
      email_verified = EXCLUDED.email_verified,
      last_login_at = NOW()
    RETURNING id
    `,
    [decodedToken.uid, email, displayName, photoUrl, emailVerified]
  );

  const userId = result.rows[0].id;
  const profileResult = await query(
    `
    SELECT
      u.*,
      CASE
        WHEN aa.user_id IS NOT NULL THEN
          CASE WHEN aa.active THEN aa.role::text ELSE 'user' END
        ELSE u.role::text
      END AS effective_role,
      COALESCE(aa.active, FALSE) AS admin_access_active,
      aa.role::text AS admin_access_role
    FROM users u
    LEFT JOIN admin_access aa ON aa.user_id = u.id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  return profileResult.rows[0];
}

export async function hydrateAuth(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  const decodedToken = await verifyFirebaseToken(token);
  const dbUser = await syncUserFromToken(decodedToken);

  if (!dbUser) {
    throw unauthorized("The authenticated user could not be loaded.");
  }

  if (!dbUser.is_active) {
    throw forbidden("This account has been disabled.");
  }

  const role = dbUser.effective_role || dbUser.role || "user";

  req.auth = {
    token,
    firebaseUid: decodedToken.uid,
    firebase: decodedToken,
    dbUser: {
      ...dbUser,
      role,
    },
    role,
  };

  return req.auth;
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.trim()) {
      return next();
    }
    await hydrateAuth(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.trim()) {
      throw unauthorized("A Firebase bearer token is required.");
    }
    await hydrateAuth(req);
    return next();
  } catch (error) {
    if (error.statusCode === 503) {
      return next(
        serviceUnavailable(
          "Protected routes are not available until Firebase backend credentials are configured."
        )
      );
    }
    return next(error);
  }
}

export function requireRoles(...roles) {
  return function authorizeByRole(req, res, next) {
    if (!req.auth?.dbUser) {
      return next(unauthorized("Authentication is required."));
    }
    if (!hasRole(req.auth.role, roles)) {
      return next(forbidden("Your role does not allow this action."));
    }
    return next();
  };
}

export function requireSelfOrRoles(getTargetUserId, ...roles) {
  return function authorizeSelfOrRole(req, res, next) {
    if (!req.auth?.dbUser) {
      return next(unauthorized("Authentication is required."));
    }

    const targetUserId = String(getTargetUserId(req));
    const ownUserId = String(req.auth.dbUser.id);

    if (targetUserId === ownUserId || hasRole(req.auth.role, roles)) {
      return next();
    }

    return next(forbidden("You are not allowed to access this record."));
  };
}
