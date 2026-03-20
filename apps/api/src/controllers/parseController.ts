import { Request, Response } from "express";
import { getFile, saveParsedResult } from "../services/fileStore";
import { parseEdi } from "../services/parserService";

export async function parseController(req: Request, res: Response) {
  try {
    const rawEdi = String(req.body?.raw_edi || "").trim();
    const fileId = String(req.body?.fileId || "").trim();

    let content = rawEdi;
    if (!content && fileId) {
      const file = await getFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "fileId not found" });
      }
      content = file.content;
    }

    if (!content) {
      return res.status(400).json({ error: "raw_edi or fileId is required" });
    }

    const parsed = await parseEdi(content);
    if (fileId) {
      await saveParsedResult(fileId, parsed);
    }

    return res.json(parsed);
  } catch (serviceError) {
    return res.status(502).json({ error: serviceError instanceof Error ? serviceError.message : "Parse failed" });
  }
}
