import { useMemo, useState } from "react";
import SegmentNode from "./SegmentNode";
import { LoopNode, ValidationIssue } from "@/types/edi";
import Badge from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import elementDictionaryJson from "@/data/element-dictionary.json";
import segmentDefinitionsJson from "@/data/segment-definitions.json";

type Severity = "error" | "warning";

const elementDictionary = elementDictionaryJson as Record<string, string>;
const segmentDefinitions = segmentDefinitionsJson as Record<string, string>;
const hlLabels: Record<string, string> = {
  "20": "Billing Provider",
  "22": "Subscriber",
  "23": "Patient",
};

function issueBelongsToSegment(issue: ValidationIssue, segmentId: string, loopId: string): boolean {
  if (issue.segment !== segmentId) {
    return false;
  }
  if (!issue.loop || issue.loop === "structural") {
    return true;
  }
  return issue.loop === loopId;
}

function getSeverity(issues: ValidationIssue[]): Severity | undefined {
  if (issues.some((issue) => issue.severity === "error")) {
    return "error";
  }
  if (issues.some((issue) => issue.severity === "warning")) {
    return "warning";
  }
  return undefined;
}

function getElementCode(segmentId: string, position: number): string {
  return `${segmentId}${String(position + 1).padStart(2, "0")}`;
}

function LoopCard({
  node,
  depth,
  issues,
  onSelectIssue,
}: {
  node: LoopNode;
  depth: number;
  issues: ValidationIssue[];
  onSelectIssue?: (issue: ValidationIssue) => void;
}): JSX.Element {
  const [open, setOpen] = useState(true);

  const nodeIssues = issues.filter((issue) => issue.loop === node.loop);
  const segmentIssueCollection = node.segments.flatMap((segment) => issues.filter((issue) => issueBelongsToSegment(issue, segment.id, node.loop)));
  const severity = getSeverity([...nodeIssues, ...segmentIssueCollection]);

  const loopSubtitle = node.hl_id ? `Loop ${node.loop} (${hlLabels[node.hl_id] ?? `HL ${node.hl_id}`})` : `Loop ${node.loop}`;

  return (
    <Card className={`${severity === "error" ? "border-red-200" : severity === "warning" ? "border-amber-200" : ""}`}>
      <CardHeader className="pb-2">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen((value) => !value)} type="button">
          <SegmentNode name={loopSubtitle} depth={depth} severity={severity} issues={nodeIssues} onSelectIssue={onSelectIssue} />
          <span className="ml-3 text-xs text-slate-500">{open ? "Collapse" : "Expand"}</span>
        </button>
      </CardHeader>

      {open ? (
        <CardContent className="space-y-2">
          {node.segments.map((segment) => {
            const segmentIssues = issues.filter((issue) => issueBelongsToSegment(issue, segment.id, node.loop));
            const segmentSeverity = getSeverity(segmentIssues);
            const segmentLabel = segmentDefinitions[segment.id] ?? "Unknown segment";

            return (
              <div
                key={`${segment.id}-${segment.index}`}
                style={{ marginLeft: `${(depth + 1) * 14}px` }}
                className={`rounded-lg border p-3 ${segmentSeverity === "error"
                  ? "border-red-200 bg-red-50"
                  : segmentSeverity === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                  }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-sm font-semibold text-slate-900">
                    {segment.id} ({segmentLabel})
                  </span>
                  {segmentSeverity === "error" ? <Badge variant="error">Error</Badge> : null}
                  {segmentSeverity === "warning" ? <Badge variant="warning">Warning</Badge> : null}
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  {segment.elements.map((value, idx) => {
                    const elementCode = getElementCode(segment.id, idx);
                    const elementName = elementDictionary[elementCode] ?? `Element ${idx + 1}`;
                    return (
                      <div key={`${elementCode}-${idx}`} className="rounded border border-slate-200 bg-white px-2 py-1">
                        <span className="font-medium">{elementCode}</span> ({elementName}): <span className="font-mono">{value || ""}</span>
                      </div>
                    );
                  })}
                </div>

                {segmentIssues.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {segmentIssues.map((issue, idx) => (
                      <li key={`${issue.code}-${idx}`}>
                        <button
                          className="rounded border border-transparent px-2 py-1 text-left text-xs text-slate-700 hover:border-primary/30 hover:bg-white"
                          onClick={() => onSelectIssue?.(issue)}
                          type="button"
                        >
                          {issue.error || issue.message}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
          <div className="space-y-2">
            {node.children.map((child) => (
              <LoopCard key={`${child.loop}-${child.hl_id ?? "na"}`} node={child} depth={depth + 1} issues={issues} onSelectIssue={onSelectIssue} />
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function SegmentTree({
  loops,
  issues = [],
  onSelectIssue,
}: {
  loops: LoopNode[];
  issues?: ValidationIssue[];
  onSelectIssue?: (issue: ValidationIssue) => void;
}) {
  const orderedLoops = useMemo(() => [...loops].sort((a, b) => Number(a.hl_id || 0) - Number(b.hl_id || 0)), [loops]);

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">Loop Tree</h3>
      {orderedLoops.length === 0 ? <p className="text-sm text-slate-600">No HL loops found in this transaction.</p> : null}
      {orderedLoops.map((loop) => (
        <LoopCard key={`${loop.loop}-${loop.hl_id ?? "root"}`} node={loop} depth={0} issues={issues} onSelectIssue={onSelectIssue} />
      ))}
    </section>
  );
}
