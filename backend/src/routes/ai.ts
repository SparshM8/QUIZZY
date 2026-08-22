import { Router } from "express";
import { handleInterviewChat } from "../controllers/ai";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/interview", authenticate, handleInterviewChat);

export { router as aiRouter };
