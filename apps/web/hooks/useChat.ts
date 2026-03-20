"use client";

import { useState } from "react";
import { askAi } from "@/lib/api";

type AskContext = {
  element?: string;
  loop_name?: string;
};

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ explanation: string; suggested_fix: string } | null>(null);

  async function ask(
    question: string,
    transactionType: string,
    segment: string,
    error: string,
    value?: string | null,
    context?: AskContext,
  ) {
    setLoading(true);
    try {
      const answer = await askAi(question, transactionType, segment, error, value, context);
      setResponse(answer);
      return answer;
    } finally {
      setLoading(false);
    }
  }

  return { ask, response, loading };
}
