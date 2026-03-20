export type Segment = {
  id: string;
  elements: string[];
  index: number;
  loop?: string;
};

export type LoopNode = {
  loop: string;
  hl_id?: string;
  parent_id?: string;
  segments: Segment[];
  children: LoopNode[];
};

export type ParseResult = {
  transaction_type: string;
  type: string;
  sender: string;
  receiver: string;
  date: string;
  segments: Segment[];
  loops: LoopNode[];
  metadata: Record<string, unknown>;
};

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  loop?: string;
  segment?: string;
  element?: string;
  element_position?: number;
  value?: string | null;
  error?: string;
  explanation?: string;
  suggestion?: string;
  fix_suggestion?: string;
};

export type ValidationResult = {
  transaction_type: string;
  is_valid: boolean;
  issues: ValidationIssue[];
  summary: { total: number; errors: number; warnings: number };
};

export type TranslationResult = {
  transaction_type: string;
  sections?: {
    overview?: {
      summary?: string;
      sender_to_receiver?: string;
      transaction_date?: string;
    };
    participants?: {
      provider?: { name?: string; npi?: string | null };
      payer?: { name?: string; payer_id?: string | null };
      patient_or_subscriber?: { name?: string | null; id?: string | null };
    };
    details?: {
      claims?: Array<{
        claim_id?: string | null;
        status?: string | null;
        billed?: number | null;
        paid?: number | null;
        adjustment?: number | null;
        highlights?: string[];
      }>;
      remittance_lines?: Array<{
        claim_id?: string | null;
        amount?: number | null;
        adjustment_notes?: string[];
      }>;
      enrollment_members?: Array<{
        member_name?: string | null;
        member_id?: string | null;
        status?: string | null;
        plan?: string | null;
        effective_date?: string | null;
      }>;
    };
    issues_summary?: {
      total_errors?: number;
      total_warnings?: number;
      top_issues?: Array<{ severity?: string; code?: string; message?: string }>;
    };
  };
  issues_summary?: Record<string, unknown>;
  readable_walkthrough?: string;
};
