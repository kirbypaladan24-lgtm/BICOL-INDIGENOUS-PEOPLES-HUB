import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      id: req.auth.dbUser.id,
      firebase_uid: req.auth.dbUser.firebase_uid,
      email: req.auth.dbUser.email,
      username: req.auth.dbUser.username,
      display_name: req.auth.dbUser.display_name,
      role: req.auth.role,
      is_active: req.auth.dbUser.is_active,
      email_verified: req.auth.dbUser.email_verified,
      preferred_language: req.auth.dbUser.preferred_language,
      last_login_at: req.auth.dbUser.last_login_at,
    });
  })
);

export default router;
