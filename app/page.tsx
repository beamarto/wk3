import CardDirectory from "@/app/components/CardDirectory";
import { supabase } from "@/lib/supabase";
import type { CardWithCategory, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [cardsResult, categoriesResult] = await Promise.all([
    supabase
      .from("cards")
      .select("*, categories(name, color)")
      .order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (cardsResult.error || categoriesResult.error) {
    const message =
      cardsResult.error?.message ?? categoriesResult.error?.message;
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Could not load directory
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">{message}</p>
        <p className="mt-2 text-sm text-zinc-500">
          Check Supabase RLS policies (anon SELECT) and your .env variables.
        </p>
      </div>
    );
  }

  const cards = (cardsResult.data ?? []) as CardWithCategory[];
  const categories = (categoriesResult.data ?? []) as Category[];

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <CardDirectory cards={cards} categories={categories} />
    </div>
  );
}
