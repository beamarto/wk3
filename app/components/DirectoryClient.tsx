"use client";

import AuthButton from "@/app/components/AuthButton";
import CardDirectory from "@/app/components/CardDirectory";
import { supabase } from "@/lib/supabase";
import type { CardWithCategory, Category } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const EMPTY_FORM = {
  name: "",
  title: "",
  email: "",
  phone: "",
  website: "",
  category_id: "",
};

type DirectoryClientProps = {
  initialCards: CardWithCategory[];
  initialCategories: Category[];
};

export default function DirectoryClient({
  initialCards,
  initialCategories,
}: DirectoryClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [categories] = useState(initialCategories);
  const [user, setUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);

  const refreshCards = useCallback(async () => {
    const { data, error } = await supabase
      .from("cards")
      .select("*, categories(name, color)")
      .order("name");
    if (!error && data) {
      setCards(data as CardWithCategory[]);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleAdd = async () => {
    const { name, title, email, phone, website, category_id } = addFormData;
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("cards").insert([
      {
        name,
        title,
        email,
        phone,
        website,
        category_id: category_id || null,
      },
    ]);
    if (error) {
      alert(`Add failed: ${error.message}`);
    } else {
      await refreshCards();
      setAddFormData(EMPTY_FORM);
      setShowAddForm(false);
    }
    setAdding(false);
  };

  const handleUpdate = async (
    id: string,
    fields: {
      name: string;
      title: string;
      email: string;
      phone: string;
      website: string;
    },
  ) => {
    const { error } = await supabase.from("cards").update(fields).eq("id", id);
    if (error) {
      alert(`Update failed: ${error.message}`);
      return false;
    }
    await refreshCards();
    return true;
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="mx-auto flex w-full max-w-6xl justify-end px-6 pt-6 sm:px-10">
        <AuthButton />
      </div>
      <CardDirectory
        cards={cards}
        categories={categories}
        user={user}
        showAddForm={showAddForm}
        addFormData={addFormData}
        adding={adding}
        onToggleAddForm={() => {
          setShowAddForm((v) => !v);
          setAddFormData(EMPTY_FORM);
        }}
        onAddFormChange={setAddFormData}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
