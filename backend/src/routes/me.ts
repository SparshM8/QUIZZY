import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getMeController, updateMeController, changePasswordController } from "../controllers/me";

export const meRouter = Router();

meRouter.get("/", authenticate, getMeController);
meRouter.patch("/", authenticate, ...(updateMeController as import("express").RequestHandler[]));
meRouter.patch("/password", authenticate, ...(changePasswordController as import("express").RequestHandler[]));
