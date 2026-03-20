"use client";

import { useCallback, useState } from "react";
import { parseByFileId, validateEdi } from "@/lib/api";
import { ParseResult, ValidationResult } from "@/types/edi";

export function useParse() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseAndValidateByFileId = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = await parseByFileId(fileId);
      const validated = await validateEdi(parsed.transaction_type, parsed.segments, fileId);
      setParseResult(parsed);
      setValidation(validated);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Parse failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { parseResult, validation, loading, error, parseAndValidateByFileId };
}
