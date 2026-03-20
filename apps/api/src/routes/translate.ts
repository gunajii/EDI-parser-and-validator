import { Router } from "express";

import { translateController } from "../controllers/translateController";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();
router.post("/", asyncHandler(translateController));

export default router;

