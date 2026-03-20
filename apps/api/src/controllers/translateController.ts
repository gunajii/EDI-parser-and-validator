import { Request, Response } from "express";

import { translateEdi } from "../services/translateService";

export async function translateController(req: Request, res: Response) {
  try {
    const { transaction_type, parsed, issues } = req.body || {};
    if (!parsed) {
      return res.status(400).json({ error: "parsed is required" });
    }

    const result = await translateEdi({
      transaction_type: transaction_type ? String(transaction_type) : undefined,
      parsed,
      issues: Array.isArray(issues) ? issues : undefined,
    });

    return res.json(result);
  } catch (serviceError) {
    return res.status(502).json({ error: serviceError instanceof Error ? serviceError.message : "Translate failed" });
  }
}

