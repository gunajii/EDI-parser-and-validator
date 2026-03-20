import { env } from "../config/env";

export async function translateEdi(payload: { transaction_type?: string; parsed: unknown; issues?: unknown[] }) {
  const response = await fetch(`${env.aiUrl}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transaction_type: payload.transaction_type ?? undefined,
      parsed: payload.parsed,
      issues: payload.issues ?? undefined,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `AI translate failed: ${response.status}`);
  }

  return response.json();
}

