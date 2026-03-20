const claims = [
  { claimId: "A10001", patient: "Jane Doe", total: "$512.09", status: "Accepted" },
  { claimId: "A10002", patient: "John Smith", total: "$123.40", status: "Rejected" },
];

export default function ClaimsTable() {
  return (
    <section className="rounded border bg-white p-4">
      <h2 className="mb-3 text-xl font-semibold">837 Claims</h2>
      <table className="min-w-full text-sm">
        <thead>
          <tr><th className="text-left">Claim</th><th className="text-left">Patient</th><th className="text-left">Amount</th><th className="text-left">Status</th></tr>
        </thead>
        <tbody>{claims.map((c) => <tr key={c.claimId}><td>{c.claimId}</td><td>{c.patient}</td><td>{c.total}</td><td>{c.status}</td></tr>)}</tbody>
      </table>
    </section>
  );
}
