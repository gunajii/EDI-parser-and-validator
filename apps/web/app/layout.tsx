import "../styles/globals.css";
import Link from "next/link";

export const metadata = {
  title: "Healthcare EDI Validator",
  description: "Upload, parse, validate, and explain X12 healthcare transactions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold">Healthcare EDI Validator</Link>
            <Link href="/upload">Upload</Link>
            <Link href="/dashboard/837">837 Dashboard</Link>
            <Link href="/dashboard/835">835 Dashboard</Link>
            <Link href="/dashboard/834">834 Dashboard</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
