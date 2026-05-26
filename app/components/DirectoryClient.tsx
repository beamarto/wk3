"use client";

import AuthButton from "@/app/components/AuthButton";
import CardDirectory from "@/app/components/CardDirectory";
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal";
import { supabase } from "@/lib/supabase";
import { getStoragePathFromPublicUrl, uploadProfilePhoto } from "@/lib/storage";
import type { CardWithCategory, Category } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  title: "",
  business: "",
  email: "",
  phone: "",
  website: "",
  category_id: "",
  bio: "",
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
  const [categories, setCategories] = useState(initialCategories);
  const [user, setUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState(EMPTY_FORM);
  const [addPhoto, setAddPhoto] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CardWithCategory | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const refreshCards = useCallback(async () => {
    const { data, error } = await supabase
      .from("cards")
      .select("*, categories(name, color)")
      .eq("status", "approved")
      .order("name");
    if (error) {
      toast.error(error.message);
      return;
    }
    setCards((data as CardWithCategory[]) ?? []);
  }, []);

  const refreshCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (!error && data) setCategories(data);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();
    refreshCategories();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, refreshCategories]);

  const handleAdd = async () => {
    const { name, title, email, phone, website, category_id, bio } =
      addFormData;
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setAdding(true);
    const { data: inserted, error } = await supabase
      .from("cards")
      .insert([
        {
          name,
          title,
          email,
          phone,
          website,
          category_id: category_id || null,
          bio: bio.trim() || null,
          status: "approved",
          approved_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error(`Add failed: ${error.message}`, { duration: 6000 });
      setAdding(false);
      return;
    }

    if (addPhoto && inserted) {
      const photoUrl = await uploadProfilePhoto(supabase, inserted.id, addPhoto);
      if (photoUrl) {
        await supabase
          .from("cards")
          .update({ profile_photo_url: photoUrl })
          .eq("id", inserted.id);
      }
    }

    await refreshCards();
    setAddFormData(EMPTY_FORM);
    setAddPhoto(null);
    setShowAddForm(false);
    setAdding(false);
    toast.success("Card added.");
  };

  const handleUpdate = async (
    id: string,
    fields: typeof EMPTY_FORM,
    photoFile?: File | null,
  ) => {
    const { error } = await supabase
      .from("cards")
      .update({
        name: fields.name,
        title: fields.title,
        email: fields.email,
        phone: fields.phone,
        website: fields.website,
        category_id: fields.category_id || null,
        bio: fields.bio.trim() || null,
      })
      .eq("id", id);

    if (error) {
      toast.error(`Update failed: ${error.message}`, { duration: 6000 });
      return false;
    }

    if (photoFile) {
      const photoUrl = await uploadProfilePhoto(supabase, id, photoFile);
      if (photoUrl) {
        await supabase
          .from("cards")
          .update({ profile_photo_url: photoUrl })
          .eq("id", id);
      }
    }

    await refreshCards();
    toast.success("Card updated.");
    return true;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.profile_photo_url) {
      const path = getStoragePathFromPublicUrl(deleteTarget.profile_photo_url);
      if (path) {
        await supabase.storage.from("profile-photos").remove([path]);
      }
    }
    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`, { duration: 6000 });
    } else {
      setCards(cards.filter((c) => c.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name}'s card has been deleted.`);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-end gap-3 px-6 pt-6 sm:px-10">
        <Link
          href="/submit"
          className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
        >
          Submit a card
        </Link>
        {user && (
          <Link
            href="/admin/submissions"
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Admin dashboard
          </Link>
        )}
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
          setAddPhoto(null);
        }}
        onAddFormChange={setAddFormData}
        onAddPhotoChange={setAddPhoto}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDeleteRequest={setDeleteTarget}
      />
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
