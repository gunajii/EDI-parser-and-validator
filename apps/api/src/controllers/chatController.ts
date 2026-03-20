import { Request, Response } from "express";
import { askAssistant } from "../services/aiService";

export async function chatController(req: Request, res: Response) {
  try {
    const { transaction_type, segment, error, value } = req.body || {};
    if (!segment || !error) {
      return res.status(400).json({ error: "segment and error are required" });
    }

    const answer = await askAssistant({
      transaction_type: String(transaction_type || "unknown"),
      segment: String(segment),
      error: String(error),
      value: value == null ? undefined : String(value),
    });

    return res.json(answer);
  } catch (serviceError) {
    return res.status(502).json({ error: serviceError instanceof Error ? serviceError.message : "AI failed" });
  }
}
