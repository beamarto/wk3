import Link from "next/link";

export default function CardNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4">
      <h1 className="text-2xl font-bold text-zinc-900">Card not found</h1>
      <p className="mt-2 text-zinc-600">
        This card may be pending approval or no longer exists.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-semibold text-amber-800 hover:underline"
      >
        ← Back to directory
      </Link>
    </main>
  );
}
