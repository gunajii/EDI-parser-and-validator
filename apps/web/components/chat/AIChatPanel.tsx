"use client";

import { FormEvent, useMemo, useState } from "react";
import { ValidationIssue } from "@/types/edi";
import { useChat } from "@/hooks/useChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const LOOP_LABELS: Record<string, string> = {
  "20": "Billing Provider",
  "22": "Subscriber",
  "23": "Patient",
};

function getLoopName(loop?: string): string {
  if (!loop) {
    return "Unknown Loop";
  }
  const suffix = loop.match(/(20|22|23)$/)?.[1];
  return suffix ? `${loop} (${LOOP_LABELS[suffix]})` : loop;
}

export default function AIChatPanel({
  transactionType,
  issues,
  selectedIssue,
}: {
  transactionType: string;
  issues: ValidationIssue[];
  selectedIssue?: ValidationIssue | null;
}) {
  const [question, setQuestion] = useState("Explain this issue and suggest a safe fix.");
  const { response, loading, ask } = useChat();

  const focusIssue = useMemo(() => selectedIssue ?? issues[0] ?? null, [issues, selectedIssue]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ask(
      question,
      transactionType,
      focusIssue?.segment ?? "UNKNOWN",
      focusIssue?.error ?? focusIssue?.message ?? "No validation issues.",
      focusIssue?.value ?? "",
      {
        element: focusIssue?.element ?? String(focusIssue?.element_position ?? ""),
        loop_name: getLoopName(focusIssue?.loop),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {focusIssue ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={focusIssue.severity === "error" ? "error" : "warning"}>{focusIssue.severity}</Badge>
              <span className="font-semibold">{focusIssue.segment || "Unknown Segment"}</span>
              <span>{focusIssue.element || focusIssue.element_position || "?"}</span>
            </div>
            <p>
              <span className="font-medium">Context:</span> value=<span className="font-mono">{focusIssue.value || ""}</span> • loop=
              {getLoopName(focusIssue.loop)}
            </p>
            <p className="mt-1">
              <span className="font-medium">Error:</span> {focusIssue.error || focusIssue.message}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select an issue from the Tree or Errors tab to provide context.</p>
        )}

        <form onSubmit={onSubmit} className="space-y-2">
          <textarea className="min-h-[84px] w-full rounded border p-2 text-sm" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button type="submit" disabled={loading || !focusIssue} className="rounded bg-primary px-3 py-2 text-white disabled:opacity-50">
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {response ? (
          <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p>
              <span className="font-semibold">Explanation:</span> {response.explanation}
            </p>
            <p>
              <span className="font-semibold">Fix suggestion:</span> {response.suggested_fix}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
