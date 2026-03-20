import { Router } from "express";
import { validateController } from "../controllers/validateController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.post("/", asyncHandler(validateController));

export default router;
