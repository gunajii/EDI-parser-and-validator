import { Router } from "express";
import multer from "multer";
import { uploadController } from "../controllers/uploadController";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), uploadController);

export default router;
