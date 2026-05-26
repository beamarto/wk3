import { createClient } from "@/lib/supabase-server";
import type { CardWithCategory } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

function cardAvatar(card: CardWithCategory) {
  return (
    card.profile_photo_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(card.name)}`;
}

export default async function ViewCardPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: card, error } = await supabase
    .from("cards")
    .select("*, categories(name, color)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !card) {
    notFound();
  }

  const typed = card as CardWithCategory;
  const category = typed.categories;
  const website = typed.website?.startsWith("http")
    ? typed.website
    : typed.website
      ? `https://${typed.website}`
      : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-zinc-50 px-4 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="text-sm font-medium text-amber-800 hover:underline dark:text-amber-300"
        >
          ← Back to directory
        </Link>

        <article className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-5 border-b border-zinc-100 bg-zinc-50 px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardAvatar(typed)}
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white dark:ring-zinc-800"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {typed.name}
              </h1>
              <p className="mt-1 text-lg text-zinc-600 dark:text-zinc-400">
                {typed.title}
              </p>
              {category && (
                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white ${category.color}`}
                >
                  {category.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 px-6 py-6 text-sm">
            {typed.bio && (
              <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                {typed.bio}
              </p>
            )}
            {typed.email && (
              <p>
                <span className="font-semibold text-zinc-500">Email</span>
                <br />
                <a
                  href={`mailto:${typed.email}`}
                  className="text-amber-800 hover:underline dark:text-amber-300"
                >
                  {typed.email}
                </a>
              </p>
            )}
            {typed.phone && (
              <p>
                <span className="font-semibold text-zinc-500">Phone</span>
                <br />
                <span className="text-zinc-800 dark:text-zinc-200">
                  {typed.phone}
                </span>
              </p>
            )}
            {website && (
              <p>
                <span className="font-semibold text-zinc-500">Website</span>
                <br />
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-amber-800 hover:underline dark:text-amber-300"
                >
                  {typed.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
