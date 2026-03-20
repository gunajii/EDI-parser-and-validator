"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParse } from "@/hooks/useParse";
import ErrorTable from "@/components/errors/ErrorTable";
import SegmentTree from "@/components/tree/SegmentTree";
import AIChatPanel from "@/components/chat/AIChatPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { translateEdi, validateEdi } from "@/lib/api";
import { LoopNode, ParseResult, Segment, TranslationResult, ValidationIssue, ValidationResult } from "@/types/edi";

type ViewerTab = "tree" | "errors" | "ai" | "translation";

type ClaimRow = {
  claimId: string;
  billed: string;
  paid: string;
  adjustment: string;
  status: string;
};

type MemberRow = {
  memberName: string;
  status: string;
  plan: string;
  effectiveDate: string;
};

function toElementIndex(issue: ValidationIssue): number | null {
  if (typeof issue.element_position === "number") {
    return Math.max(0, issue.element_position - 1);
  }
  if (issue.element && issue.segment && issue.element.startsWith(issue.segment)) {
    const suffix = issue.element.slice(issue.segment.length);
    const parsed = Number(suffix);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed - 1;
    }
  }
  return null;
}

function updateSegments(segments: Segment[], issue: ValidationIssue, nextValue: string): Segment[] {
  const expectedIndex = toElementIndex(issue);
  let hasUpdated = false;

  return segments.map((segment) => {
    if (segment.id !== issue.segment) {
      return segment;
    }
    if (issue.loop && issue.loop !== "structural" && segment.loop && segment.loop !== issue.loop) {
      return segment;
    }

    const nextElements = [...segment.elements];
    const indexToPatch = expectedIndex ?? nextElements.findIndex((value) => value === (issue.value ?? ""));
    if (indexToPatch < 0 || indexToPatch >= nextElements.length) {
      return segment;
    }

    nextElements[indexToPatch] = nextValue;
    hasUpdated = true;
    return { ...segment, elements: nextElements };
  });
}

function updateLoopSegments(nodes: LoopNode[], issue: ValidationIssue, nextValue: string): LoopNode[] {
  return nodes.map((node) => ({
    ...node,
    segments: updateSegments(node.segments, issue, nextValue),
    children: updateLoopSegments(node.children, issue, nextValue),
  }));
}

function build835Rows(segments: Segment[]): ClaimRow[] {
  const claims: ClaimRow[] = [];
  let current: ClaimRow | null = null;

  segments.forEach((segment) => {
    if (segment.id === "CLP") {
      if (current) {
        claims.push(current);
      }
      const billed = Number(segment.elements[2] ?? 0);
      const paid = Number(segment.elements[3] ?? 0);
      current = {
        claimId: segment.elements[0] || `Claim-${claims.length + 1}`,
        billed: billed ? billed.toFixed(2) : "0.00",
        paid: paid ? paid.toFixed(2) : "0.00",
        adjustment: (billed - paid).toFixed(2),
        status: segment.elements[1] || "Unknown",
      };
    }
  });

  if (current) {
    claims.push(current);
  }

  return claims;
}

function build834Rows(segments: Segment[]): MemberRow[] {
  const members: MemberRow[] = [];
  let currentName = "Unknown";

  segments.forEach((segment) => {
    if (segment.id === "NM1") {
      currentName = [segment.elements[2], segment.elements[1]].filter(Boolean).join(", ") || "Unknown Member";
    }
    if (segment.id === "INS") {
      members.push({
        memberName: currentName,
        status: segment.elements[0] === "Y" ? "Add" : "Terminate",
        plan: segment.elements[1] || "-",
        effectiveDate: "-",
      });
    }
    if (segment.id === "DTP" && members.length > 0) {
      const last = members[members.length - 1];
      last.effectiveDate = segment.elements[2] || last.effectiveDate;
    }
  });

  return members;
}

export default function ViewerPage({ params }: { params: { fileId: string } }) {
  const { parseResult, validation, loading, error, parseAndValidateByFileId } = useParse();
  const [workingParseResult, setWorkingParseResult] = useState<ParseResult | null>(null);
  const [workingValidation, setWorkingValidation] = useState<ValidationResult | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null);
  const [activeTab, setActiveTab] = useState<ViewerTab>("tree");
  const [fixingIssueKey, setFixingIssueKey] = useState<string | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    parseAndValidateByFileId(params.fileId);
  }, [params.fileId, parseAndValidateByFileId]);

  useEffect(() => {
    setWorkingParseResult(parseResult);
  }, [parseResult]);

  useEffect(() => {
    setWorkingValidation(validation);
  }, [validation]);

  useEffect(() => {
    if (activeTab !== "translation") {
      return;
    }
    if (!workingParseResult) {
      return;
    }
    if (translation || translationLoading) {
      return;
    }

    let cancelled = false;
    setTranslationLoading(true);
    setTranslationError(null);

    (async () => {
      try {
        const issues = workingValidation?.issues;
        const result = await translateEdi(workingParseResult, { issues });
        if (!cancelled) {
          setTranslation(result);
        }
      } catch (e) {
        if (!cancelled) {
          setTranslationError(e instanceof Error ? e.message : "Translation failed");
        }
      } finally {
        if (!cancelled) {
          setTranslationLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, translation, workingParseResult, workingValidation?.issues]);

  const onSelectIssue = useCallback((issue: ValidationIssue) => {
    setSelectedIssue(issue);
    setActiveTab("ai");
  }, []);

  const onApplyFix = useCallback(
    async ({ issue, nextValue }: { issue: ValidationIssue; nextValue: string }) => {
      if (!workingParseResult) {
        return;
      }
      const fixKey = `${issue.code}-${issue.segment}-${issue.element || issue.element_position || "na"}`;
      setFixingIssueKey(fixKey);

      const updatedSegments = updateSegments(workingParseResult.segments, issue, nextValue);
      const updatedLoops = updateLoopSegments(workingParseResult.loops, issue, nextValue);
      const updatedParseResult: ParseResult = {
        ...workingParseResult,
        segments: updatedSegments,
        loops: updatedLoops,
      };

      setWorkingParseResult(updatedParseResult);
      setTranslation(null);
      try {
        const revalidated = await validateEdi(updatedParseResult.transaction_type, updatedParseResult.segments, params.fileId);
        setWorkingValidation(revalidated);
      } finally {
        setFixingIssueKey(null);
      }
    },
    [params.fileId, workingParseResult],
  );

  const claims835 = useMemo(() => (workingParseResult?.transaction_type === "835" ? build835Rows(workingParseResult.segments) : []), [workingParseResult]);
  const members834 = useMemo(() => (workingParseResult?.transaction_type === "834" ? build834Rows(workingParseResult.segments) : []), [workingParseResult]);

  const issues = workingValidation?.issues || [];

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 bg-slate-50 px-4 py-8 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Healthcare EDI Debug Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            {!loading && !error && !workingParseResult ? <p className="text-slate-500">Upload a file to begin.</p> : null}
            {loading ? <p className="animate-pulse text-sm text-slate-600">Parsing and validating transaction…</p> : null}
            {error ? <p className="text-red-600">{error}</p> : null}
          </CardContent>
        </Card>

        {workingParseResult && workingValidation ? (
          <>
            <Tabs
              items={[
                { key: "tree", label: "Tree" },
                { key: "errors", label: "Errors", count: issues.length },
                { key: "ai", label: "AI" },
                { key: "translation", label: "Translation" },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === "tree" ? (
              <TabPanel>
                <SegmentTree loops={workingParseResult.loops} issues={issues} onSelectIssue={onSelectIssue} />
              </TabPanel>
            ) : null}

            {activeTab === "errors" ? (
              <TabPanel>
                <ErrorTable issues={issues} onApplyFix={onApplyFix} fixingIssueKey={fixingIssueKey} onSelectIssue={onSelectIssue} />
              </TabPanel>
            ) : null}

            {activeTab === "ai" ? (
              <TabPanel>
                <AIChatPanel transactionType={workingParseResult.transaction_type} issues={issues} selectedIssue={selectedIssue} />
              </TabPanel>
            ) : null}

            {activeTab === "translation" ? (
              <TabPanel>
                <Card>
                  <CardHeader>
                    <CardTitle>Translation (Narrative)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {translationLoading ? <p className="text-sm text-slate-600">Generating narrative…</p> : null}
                    {translationError ? <p className="text-sm text-red-600">{translationError}</p> : null}

                    {!translationLoading && !translationError && translation ? (
                      <div className="space-y-3 text-sm text-slate-800">
                        <p className="text-base font-semibold text-slate-900">
                          {translation.sections?.overview?.summary || translation.transaction_type || "EDI Transaction"}
                        </p>
                        <p className="whitespace-pre-wrap text-slate-700">
                          {translation.readable_walkthrough ||
                            (translation.sections?.overview?.sender_to_receiver
                              ? `Transaction from ${translation.sections.overview.sender_to_receiver} dated ${translation.sections.overview.transaction_date}`
                              : "Transaction parsed successfully. No narrative available.")}
                        </p>
                        {translation.sections?.participants?.provider?.name ? (
                          <p><strong>Provider:</strong> {translation.sections.participants.provider.name} (NPI: {translation.sections.participants.provider.npi || "N/A"})</p>
                        ) : null}
                        {translation.sections?.participants?.payer?.name ? (
                          <p><strong>Payer:</strong> {translation.sections.participants.payer.name}</p>
                        ) : null}
                        {translation.sections?.issues_summary?.total_errors > 0 ? (
                          <p className="text-red-600"><strong>Errors:</strong> {translation.sections.issues_summary.total_errors} | <strong>Warnings:</strong> {translation.sections.issues_summary.total_warnings}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {!translationLoading && !translationError && !translation ? (
                      <p className="text-sm text-slate-500">Open this tab to generate a narrative translation.</p>
                    ) : null}
                  </CardContent>
                </Card>
              </TabPanel>
            ) : null}
          </>
        ) : null}

        {workingParseResult?.transaction_type === "835" ? (
          <Card>
            <CardHeader>
              <CardTitle>835 Claims Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Claim ID</th>
                    <th className="py-2">Billed</th>
                    <th className="py-2">Paid</th>
                    <th className="py-2">Adjustment</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {claims835.map((row) => (
                    <tr key={row.claimId} className="border-b last:border-0">
                      <td className="py-2">{row.claimId}</td>
                      <td className="py-2">{row.billed}</td>
                      <td className="py-2">{row.paid}</td>
                      <td className="py-2">{row.adjustment}</td>
                      <td className="py-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}

        {workingParseResult?.transaction_type === "834" ? (
          <Card>
            <CardHeader>
              <CardTitle>834 Enrollment Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-2">Member Name</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Plan</th>
                    <th className="py-2">Effective Date</th>
                  </tr>
                </thead>
                <tbody>
                  {members834.map((row, idx) => (
                    <tr key={`${row.memberName}-${idx}`} className="border-b last:border-0">
                      <td className="py-2">{row.memberName}</td>
                      <td className="py-2">{row.status}</td>
                      <td className="py-2">{row.plan}</td>
                      <td className="py-2">{row.effectiveDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <aside className="space-y-4">
        {workingParseResult && workingValidation ? (
          <AIChatPanel transactionType={workingParseResult.transaction_type} issues={issues} selectedIssue={selectedIssue} />
        ) : null}
      </aside>
    </main>
  );
}
