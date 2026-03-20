import Badge from "@/components/ui/Badge";
import { ValidationIssue } from "@/types/edi";

export default function SegmentNode({
  name,
  depth,
  severity,
  issues = [],
  onSelectIssue,
}: {
  name: string;
  depth: number;
  severity?: "error" | "warning";
  issues?: ValidationIssue[];
  onSelectIssue?: (issue: ValidationIssue) => void;
}) {
  const nodeTint = severity === "error" ? "bg-red-50 border-red-200" : severity === "warning" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200";

  return (
    <div style={{ marginLeft: `${depth * 14}px` }} className={`rounded border px-3 py-2 text-sm ${nodeTint}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-800">{name}</span>
        {severity === "error" ? <Badge variant="error">Error</Badge> : null}
        {severity === "warning" ? <Badge variant="warning">Warning</Badge> : null}
      </div>
      {issues.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-700">
          {issues.map((issue, index) => (
            <li key={`${issue.code}-${index}`}>
              <span
                role="button"
                tabIndex={0}
                onClick={() => onSelectIssue?.(issue)}
                onKeyDown={(e) => e.key === "Enter" && onSelectIssue?.(issue)}
                className="cursor-pointer text-left hover:text-primary hover:underline"
              >
                {issue.error || issue.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
