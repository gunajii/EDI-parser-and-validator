import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import chatRoutes from "./routes/chat";
import parseRoutes from "./routes/parse";
import uploadRoutes from "./routes/upload";
import translateRoutes from "./routes/translate";
import validateRoutes from "./routes/validate";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(logger);

app.get("/health", (_req, res) => res.json({ status: "ok", service: "api-gateway" }));
app.use("/upload", uploadRoutes);
app.use("/parse", parseRoutes);
app.use("/validate", validateRoutes);
app.use("/chat", chatRoutes);
app.use("/translate", translateRoutes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API gateway listening on ${env.port}`);
});
