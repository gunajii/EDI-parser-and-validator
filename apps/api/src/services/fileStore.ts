import { randomUUID } from "node:crypto";

import { supabase } from "../config/supabase";

type StoredFile = {
  fileName: string;
  content: string;
  uploadedAt: string;
};

type ParsedResult = {
  fileId: string;
  parsedJson: unknown;
  createdAt: string;
};

type ValidationResult = {
  fileId: string;
  validationJson: unknown;
  createdAt: string;
};

const fileMap = new Map<string, StoredFile>();
const parsedMap = new Map<string, ParsedResult>();
const validationMap = new Map<string, ValidationResult>();

export async function saveFile(fileName: string, content: string) {
  const fileId = randomUUID();
  const uploadedAt = new Date().toISOString();
  fileMap.set(fileId, { fileName, content, uploadedAt });

  if (supabase) {
    await supabase.from("edi_uploads").insert({ file_id: fileId, file_name: fileName, content, uploaded_at: uploadedAt });
  }

  return fileId;
}

export async function saveBatchFiles(files: Array<{ fileName: string; content: string }>) {
  const stored = await Promise.all(files.map(async (file) => ({ fileId: await saveFile(file.fileName, file.content), fileName: file.fileName })));
  return {
    total_files: stored.length,
    file_ids: stored,
  };
}

export async function getFile(fileId: string) {
  const fromMemory = fileMap.get(fileId);
  if (fromMemory) {
    return fromMemory;
  }

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("edi_uploads")
    .select("file_name, content, uploaded_at")
    .eq("file_id", fileId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    fileName: data.file_name,
    content: data.content,
    uploadedAt: data.uploaded_at,
  };
}

export async function saveParsedResult(fileId: string, parsedJson: unknown) {
  const createdAt = new Date().toISOString();
  const payload = { fileId, parsedJson, createdAt };
  parsedMap.set(fileId, payload);

  if (supabase) {
    await supabase.from("edi_parsed_results").upsert({ file_id: fileId, parsed_json: parsedJson, created_at: createdAt });
  }

  return payload;
}

export async function saveValidationResult(fileId: string, validationJson: unknown) {
  const createdAt = new Date().toISOString();
  const payload = { fileId, validationJson, createdAt };
  validationMap.set(fileId, payload);

  if (supabase) {
    await supabase.from("edi_validation_results").upsert({ file_id: fileId, validation_json: validationJson, created_at: createdAt });
  }

  return payload;
}

export function getStoredParsedResult(fileId: string) {
  return parsedMap.get(fileId) || null;
}

export function getStoredValidationResult(fileId: string) {
  return validationMap.get(fileId) || null;
}
