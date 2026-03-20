import { env } from "../config/env";

export async function askAssistant(payload: { transaction_type: string; segment: string; error: string; value?: string }) {
  const response = await fetch(`${env.aiUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI service failed: ${response.status}`);
  }

  return response.json();
}
