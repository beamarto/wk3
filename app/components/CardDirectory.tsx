"use client";

import type { CardWithCategory, Category } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { useMemo, useState } from "react";

function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

type AddFormData = {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  category_id: string;
};

type CardDirectoryProps = {
  cards: CardWithCategory[];
  categories: Category[];
  user?: User | null;
  showAddForm?: boolean;
  addFormData?: AddFormData;
  adding?: boolean;
  onToggleAddForm?: () => void;
  onAddFormChange?: (data: AddFormData) => void;
  onAdd?: () => void;
  onUpdate?: (
    id: string,
    fields: {
      name: string;
      title: string;
      email: string;
      phone: string;
      website: string;
    },
  ) => Promise<boolean>;
};

export default function CardDirectory({
  cards,
  categories,
  user = null,
  showAddForm = false,
  addFormData,
  adding = false,
  onToggleAddForm,
  onAddFormChange,
  onAdd,
  onUpdate,
}: CardDirectoryProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<AddFormData | null>(null);

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

  const startEdit = (card: CardWithCategory) => {
    setEditingId(card.id);
    setEditFormData({
      name: card.name,
      title: card.title,
      email: card.email,
      phone: card.phone,
      website: card.website,
      category_id: card.category_id,
    });
  };

  const saveEdit = async (id: string) => {
    if (!editFormData || !onUpdate) return;
    const ok = await onUpdate(id, {
      name: editFormData.name,
      title: editFormData.title,
      email: editFormData.email,
      phone: editFormData.phone,
      website: editFormData.website,
    });
    if (ok) {
      setEditingId(null);
      setEditFormData(null);
    }
  };

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
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            All
          </span>{" "}
          to see everyone.
        </p>
        {user && onToggleAddForm && (
          <button
            type="button"
            onClick={onToggleAddForm}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-800"
          >
            {showAddForm ? "Cancel" : "+ Add café card"}
          </button>
        )}
      </header>

      {user && showAddForm && addFormData && onAddFormChange && onAdd && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            New café card
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Name", "name", true],
                ["Title", "title", false],
                ["Email", "email", false],
                ["Phone", "phone", false],
              ] as const
            ).map(([label, key, required]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {label}
                  {required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950"
                  value={addFormData[key]}
                  onChange={(e) =>
                    onAddFormChange({ ...addFormData, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category
              </label>
              <select
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950"
                value={addFormData.category_id}
                onChange={(e) =>
                  onAddFormChange({
                    ...addFormData,
                    category_id: e.target.value,
                  })
                }
              >
                <option value="">— Select —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Website
              </label>
              <input
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950"
                value={addFormData.website}
                onChange={(e) =>
                  onAddFormChange({
                    ...addFormData,
                    website: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onToggleAddForm}
              className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAdd}
              disabled={adding}
              className="rounded-full bg-amber-700 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {adding ? "Saving…" : "Save card"}
            </button>
          </div>
        </div>
      )}

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
            const isEditing = editingId === card.id;

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
                    {isEditing && editFormData ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Name"
                        />
                        <input
                          className="w-full rounded border px-2 py-1 text-sm"
                          value={editFormData.title}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              title: e.target.value,
                            })
                          }
                          placeholder="Title"
                        />
                      </div>
                    ) : (
                      <>
                        <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {card.name}
                        </h2>
                        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                          {card.title}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 px-5 py-4 text-sm">
                  {category && !isEditing && (
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold text-white ${category.color}`}
                    >
                      {category.name}
                    </span>
                  )}

                  {isEditing && editFormData ? (
                    <div className="space-y-2">
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            email: e.target.value,
                          })
                        }
                        placeholder="Email"
                      />
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Phone"
                      />
                      <input
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={editFormData.website}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            website: e.target.value,
                          })
                        }
                        placeholder="Website"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => saveEdit(card.id)}
                          className="rounded bg-amber-700 px-3 py-1 text-xs font-bold text-white uppercase hover:bg-amber-800"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditFormData(null);
                          }}
                          className="rounded bg-zinc-100 px-3 py-1 text-xs font-bold uppercase text-zinc-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                      {user && onUpdate && (
                        <button
                          type="button"
                          onClick={() => startEdit(card)}
                          className="mt-2 w-fit rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-800 hover:bg-amber-700 hover:text-white"
                        >
                          Edit card
                        </button>
                      )}
                    </>
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
