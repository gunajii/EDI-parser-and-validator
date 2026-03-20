import { Router } from "express";
import { parseController } from "../controllers/parseController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.post("/", asyncHandler(parseController));

export default router;
