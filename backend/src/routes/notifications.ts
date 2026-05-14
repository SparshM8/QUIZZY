import { Router } from "express";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as notifications from "../controllers/notifications";

export const notificationsRouter = Router();

notificationsRouter.get("/", authenticate, notifications.listNotifications);

notificationsRouter.patch(
  "/read",
  authenticate,
  validate([body("ids").optional().isArray()]),
  notifications.markRead
);
