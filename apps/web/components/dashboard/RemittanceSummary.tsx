type RemitClaim = {
  claim_id: string;
  billed: number;
  paid: number;
  adjustments: number;
};

const claims: RemitClaim[] = [
  { claim_id: "CLM1001", billed: 950, paid: 880, adjustments: 70 },
  { claim_id: "CLM1002", billed: 1200, paid: 990, adjustments: 210 },
];

const totals = claims.reduce(
  (acc, claim) => {
    acc.billed += claim.billed;
    acc.paid += claim.paid;
    acc.adjustments += claim.adjustments;
    return acc;
  },
  { billed: 0, paid: 0, adjustments: 0 },
);

export default function RemittanceSummary() {
  return (
    <section className="rounded border bg-white p-4">
      <h2 className="mb-3 text-xl font-semibold">835 Remittance Summary</h2>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded bg-slate-50 p-3"><p className="text-sm text-slate-600">Total Billed</p><p className="text-lg font-semibold">${totals.billed.toFixed(2)}</p></div>
        <div className="rounded bg-slate-50 p-3"><p className="text-sm text-slate-600">Total Paid</p><p className="text-lg font-semibold">${totals.paid.toFixed(2)}</p></div>
        <div className="rounded bg-slate-50 p-3"><p className="text-sm text-slate-600">Adjustments</p><p className="text-lg font-semibold">${totals.adjustments.toFixed(2)}</p></div>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th>Claim ID</th>
            <th>Billed</th>
            <th>Paid</th>
            <th>Adjustments</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.claim_id} className="border-t">
              <td>{claim.claim_id}</td>
              <td>${claim.billed.toFixed(2)}</td>
              <td>${claim.paid.toFixed(2)}</td>
              <td>${claim.adjustments.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
