import { ParseResult, ValidationResult } from "@/types/edi";
import { API_BASE } from "./constants";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function uploadFile(file: File): Promise<{ fileId: string }> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  return handleResponse<{ fileId: string }>(response);
}

export async function parseByFileId(fileId: string): Promise<ParseResult> {
  const response = await fetch(`${API_BASE}/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  });
  return handleResponse<ParseResult>(response);
}

export async function validateEdi(transaction_type: string, segments: unknown[], fileId?: string): Promise<ValidationResult> {
  const response = await fetch(`${API_BASE}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_type, segments, fileId }),
  });
  return handleResponse<ValidationResult>(response);
}

export async function askAi(
  question: string,
  transaction_type: string,
  segment: string,
  error: string,
  value?: string | null,
  context?: { element?: string; loop_name?: string },
): Promise<{ explanation: string; suggested_fix: string }> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      transaction_type,
      segment,
      element: context?.element,
      loop_name: context?.loop_name,
      error,
      value: value ?? "",
    }),
  });
  return handleResponse<{ explanation: string; suggested_fix: string }>(response);
}

export async function translateEdi(
  parsed: ParseResult,
  options?: { issues?: ValidationResult["issues"] },
): Promise<any> {
  const response = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_type: parsed.transaction_type,
      parsed,
      issues: options?.issues ?? undefined,
    }),
  });

  return handleResponse<any>(response);
}
