"use client";

import AuthButton from "@/app/components/AuthButton";
import CardDirectory from "@/app/components/CardDirectory";
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal";
import { supabase } from "@/lib/supabase";
import { getStoragePathFromPublicUrl } from "@/lib/storage";
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
    if (error) {
      toast.error(`Could not load categories: ${error.message}`, {
        duration: 6000,
      });
      return;
    }
    if (data && data.length > 0) {
      setCategories(data);
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
    refreshCategories();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router, refreshCategories]);

  useEffect(() => {
    if (user) {
      refreshCategories();
    }
  }, [user, refreshCategories]);

  const saveCardViaApi = async (
    fields: typeof EMPTY_FORM,
    options: { id?: string; photo?: File | null },
  ) => {
    const formData = new FormData();
    if (options.id) formData.append("id", options.id);
    formData.append("name", fields.name.trim());
    formData.append("title", fields.title);
    formData.append("email", fields.email);
    formData.append("phone", fields.phone);
    formData.append("website", fields.website);
    formData.append("category_id", fields.category_id);
    formData.append("bio", fields.bio);
    if (options.photo) formData.append("photo", options.photo);

    const res = await fetch("/api/admin/save-card", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = (await res.json()) as {
      error?: string;
      success?: boolean;
      photoWarning?: string | null;
    };
    if (!res.ok) {
      throw new Error(data.error || "Could not save card.");
    }
    return data;
  };

  const handleAdd = async () => {
    if (!addFormData.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setAdding(true);
    try {
      const data = await saveCardViaApi(addFormData, { photo: addPhoto });
      await refreshCards();
      setAddFormData(EMPTY_FORM);
      setAddPhoto(null);
      setShowAddForm(false);
      if (data.photoWarning) {
        toast.warning(data.photoWarning, { duration: 8000 });
      } else {
        toast.success(
          addPhoto ? "Card and photo saved." : "Card added.",
        );
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Add failed.",
        { duration: 6000 },
      );
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (
    id: string,
    fields: typeof EMPTY_FORM,
    photoFile?: File | null,
  ) => {
    try {
      const data = await saveCardViaApi(fields, { id, photo: photoFile });
      await refreshCards();
      if (data.photoWarning) {
        toast.warning(data.photoWarning, { duration: 8000 });
      } else {
        toast.success("Card updated.");
      }
      return true;
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Update failed.",
        { duration: 6000 },
      );
      return false;
    }
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
        addPhoto={addPhoto}
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
