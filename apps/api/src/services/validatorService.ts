import { env } from "../config/env";

export async function validateEdi(transaction_type: string, segments: unknown[]) {
  const response = await fetch(`${env.validatorUrl}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_type, segments }),
  });

  if (!response.ok) {
    throw new Error(`Validator failed: ${response.status}`);
  }

  return response.json();
}
