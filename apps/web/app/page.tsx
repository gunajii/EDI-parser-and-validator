import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Healthcare EDI Validator</h1>
      <p className="text-slate-600">
        Parse, validate, and visualize X12 files (837P, 837I, 835, 834), then ask the AI assistant to explain errors.
      </p>
      <div className="flex gap-3">
        <Link href="/upload" className="rounded bg-primary px-4 py-2 text-white">Upload File</Link>
        <Link href="/dashboard/835" className="rounded border px-4 py-2">View Dashboards</Link>
      </div>
    </main>
  );
}
