"use client";

import { supabase } from "@/lib/supabase";
import type { CardWithCategory } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function cardAvatar(card: CardWithCategory) {
  return (
    card.profile_photo_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(card.name)}`
  );
}

export default function SubmissionsPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [cards, setCards] = useState<CardWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/");
        return;
      }
      setUser(currentUser);
      const { data, error } = await supabase
        .from("cards")
        .select("*, categories(name, color)")
        .eq("status", "pending")
        .order("name");
      if (error) toast.error(error.message);
      setCards((data as CardWithCategory[]) ?? []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("cards")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error(`Approval failed: ${error.message}`);
      return;
    }
    setCards(cards.filter((c) => c.id !== id));
    toast.success("Card approved and published!");
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("cards")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) {
      toast.error(`Rejection failed: ${error.message}`);
      return;
    }
    setCards(cards.filter((c) => c.id !== id));
    toast.success("Card rejected.");
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-zinc-500">Loading submissions…</div>
    );
  }
  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
              ← Back to directory
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold text-zinc-900">
              Pending submissions
            </h1>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
            {cards.length} pending
          </span>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
            No pending submissions. You are all caught up!
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-start gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardAvatar(card)}
                  alt={card.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-white"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-zinc-900">{card.name}</h3>
                  <p className="text-sm italic text-zinc-500">{card.title}</p>
                  {card.categories && (
                    <span className="mt-1 inline-block text-xs font-semibold text-amber-800">
                      {card.categories.name}
                    </span>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                    {card.email && <span>{card.email}</span>}
                    {card.phone && <span>{card.phone}</span>}
                    {card.website && <span>{card.website}</span>}
                  </div>
                  {card.bio?.trim() && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {card.bio}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(card.id)}
                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(card.id)}
                    className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
