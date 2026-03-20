import Badge from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ValidationIssue } from "@/types/edi";

type ApplyFixPayload = {
  issue: ValidationIssue;
  nextValue: string;
};

function guessFixedValue(issue: ValidationIssue): string | null {
  const suggestion = issue.suggestion || issue.fix_suggestion || "";
  const quoted = suggestion.match(/"([^"]+)"/);
  if (quoted?.[1]) {
    return quoted[1];
  }
  const singleQuoted = suggestion.match(/'([^']+)'/);
  return singleQuoted?.[1] ?? null;
}

export default function ErrorTable({
  issues,
  onApplyFix,
  fixingIssueKey,
  onSelectIssue,
}: {
  issues: ValidationIssue[];
  onApplyFix?: (payload: ApplyFixPayload) => void;
  fixingIssueKey?: string | null;
  onSelectIssue?: (issue: ValidationIssue) => void;
}) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validation Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-700">No errors found ✅</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Errors</CardTitle>
      </CardHeader>
      <CardContent className="max-h-[620px] overflow-y-auto p-0">
        <div className="space-y-3 p-4">
          {issues.map((issue, index) => {
            const issueKey = `${issue.code}-${index}`;
            const suggestedValue = guessFixedValue(issue);
            return (
              <div
                key={issueKey}
                className={`rounded-lg border p-3 ${issue.severity === "error" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <button type="button" className="text-left" onClick={() => onSelectIssue?.(issue)}>
                    <span className="font-semibold text-slate-900">
                      {issue.segment || "Unknown Segment"}.{issue.element || issue.element_position || "?"}: <span className="font-mono">{issue.value ?? ""}</span>
                    </span>
                  </button>
                  <Badge variant={issue.severity === "error" ? "error" : "warning"}>{issue.severity}</Badge>
                </div>

                <p className="text-sm text-slate-800">→ {issue.error || issue.message}</p>
                <p className="text-sm text-slate-700">→ {issue.explanation || issue.message}</p>
                <p className="text-sm text-emerald-700">→ {issue.suggestion || issue.fix_suggestion || "No suggestion provided."}</p>

                <div className="mt-2">
                  <button
                    type="button"
                    disabled={!suggestedValue || !onApplyFix || fixingIssueKey === issueKey}
                    onClick={() => {
                      if (!suggestedValue || !onApplyFix) {
                        return;
                      }
                      onApplyFix({ issue, nextValue: suggestedValue });
                    }}
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {fixingIssueKey === issueKey ? "Applying..." : "Apply Fix"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
