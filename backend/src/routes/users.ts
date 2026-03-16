import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { listUsersController, toggleUserController, deleteUserController } from "../controllers/users";

export const usersRouter = Router();

usersRouter.get("/", authenticate, requireRole("admin", "teacher"), listUsersController);
usersRouter.patch("/:id/active", authenticate, requireRole("admin"), toggleUserController);
usersRouter.delete("/:id", authenticate, requireRole("admin"), deleteUserController);
