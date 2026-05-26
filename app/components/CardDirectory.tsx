"use client";

import { useMemo, useState } from "react";
import type { CardWithCategory, Category } from "@/lib/types";

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

type CardDirectoryProps = {
  cards: CardWithCategory[];
  categories: Category[];
};

export default function CardDirectory({
  cards,
  categories,
}: CardDirectoryProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const category of categories) {
      counts.set(category.id, 0);
    }
    for (const card of cards) {
      counts.set(
        card.category_id,
        (counts.get(card.category_id) ?? 0) + 1,
      );
    }
    return counts;
  }, [cards, categories]);

  const visibleCards = useMemo(() => {
    if (!selectedCategoryId) return cards;
    return cards.filter((card) => card.category_id === selectedCategoryId);
  }, [cards, selectedCategoryId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10">
      <header className="space-y-2 text-center sm:text-left">
        <p className="text-sm font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Local coffee & café guide
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Café Contact Directory
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Browse local cafés by category, or tap{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">All</span>{" "}
          to see everyone.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        <button
          type="button"
          onClick={() => setSelectedCategoryId(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            selectedCategoryId === null
              ? "bg-zinc-900 text-white shadow-md ring-2 ring-amber-400 ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          All ({cards.length})
        </button>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const count = countByCategory.get(category.id) ?? 0;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition-all ${category.color} ${
                isSelected
                  ? "shadow-md ring-2 ring-white ring-offset-2 ring-offset-zinc-900 dark:ring-offset-zinc-950"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {category.name} ({count})
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-zinc-500 sm:text-left">
        Showing {visibleCards.length} of {cards.length} cards
      </p>

      {visibleCards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          {selectedCategoryId
            ? "No cards in this category (0)."
            : "No cards in the directory yet."}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => {
            const category = card.categories;
            const website = card.website?.startsWith("http")
              ? card.website
              : `https://${card.website}`;

            return (
              <li
                key={card.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-4 border-b border-zinc-100 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl(card.name)}
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full bg-white ring-2 ring-zinc-200 dark:ring-zinc-700"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {card.name}
                    </h2>
                    <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                      {card.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 px-5 py-4 text-sm">
                  {category && (
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold text-white ${category.color}`}
                    >
                      {category.name}
                    </span>
                  )}
                  <a
                    href={`mailto:${card.email}`}
                    className="truncate text-amber-800 hover:underline dark:text-amber-300"
                  >
                    {card.email}
                  </a>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {card.phone}
                  </p>
                  {card.website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
                    >
                      {card.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
