import { notFound } from "./api-error.js";
import { pickDisplayName } from "./validators.js";

export async function loadUserByIdOrThrow(client, userId, message = "User not found.") {
  const result = await client.query(
    `
    SELECT id, firebase_uid, email, username, display_name, role, is_active
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (!result.rows.length) {
    throw notFound(message);
  }

  return result.rows[0];
}

export function buildUserIdentitySnapshot(user) {
  return {
    usernameSnapshot: pickDisplayName(user),
    emailSnapshot: user?.email || null,
  };
}
