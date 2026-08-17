import { Router } from "express";
import { body } from "express-validator";
import { ROLES } from "../types/shared";
import { authenticate } from "../middleware/auth";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from "../controllers/auth";
import {
  verifyEmailController,
  resendVerificationController,
} from "../controllers/verification";
import { validate } from "../middleware/validate";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate([
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 8, max: 128 }),
    body("role").optional().isString().isIn(ROLES),
  ]),
  registerController
);

authRouter.post(
  "/login",
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 1, max: 128 }),
  ]),
  loginController
);

authRouter.post("/refresh", refreshController);
authRouter.post("/logout", authenticate, logoutController);

// Email verification — single-use, hashed, 24h-expiry tokens.
authRouter.post(
  "/verify-email",
  validate([body("token").optional({ values: "undefined" }).isString().isLength({ min: 64, max: 64 })]),
  verifyEmailController
);
authRouter.post(
  "/resend-verification",
  validate([body("email").isEmail().normalizeEmail()]),
  resendVerificationController
);
