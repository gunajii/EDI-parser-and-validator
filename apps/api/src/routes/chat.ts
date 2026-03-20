import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.post("/", asyncHandler(chatController));

export default router;
