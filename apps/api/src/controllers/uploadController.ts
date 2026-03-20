import { Request, Response } from "express";
import AdmZip from "adm-zip";
import { saveBatchFiles, saveFile } from "../services/fileStore";

const allowedExtensions = [".edi", ".txt", ".dat", ".x12"];

function isAllowedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
}

export async function uploadController(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "file is required" });
  }

  const fileName = file.originalname.toLowerCase();

  if (fileName.endsWith(".zip")) {
    const zip = new AdmZip(file.buffer);
    const entries = zip
      .getEntries()
      .filter((entry) => !entry.isDirectory && isAllowedFile(entry.entryName))
      .map((entry) => ({ fileName: entry.entryName, content: entry.getData().toString("utf-8") }));

    if (entries.length === 0) {
      return res.status(400).json({ error: "ZIP contains no supported EDI files" });
    }

    const batch = await saveBatchFiles(entries);
    return res.status(201).json({ batch });
  }

  if (!isAllowedFile(fileName)) {
    return res.status(400).json({ error: "Unsupported file type" });
  }

  const content = file.buffer.toString("utf-8");
  const fileId = await saveFile(file.originalname, content);
  return res.status(201).json({ fileId });
}
