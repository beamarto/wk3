"use client";

import BioTextarea from "@/app/components/BioTextarea";
import { supabase } from "@/lib/supabase";
import type { GenerateBioInput } from "@/lib/stream-bio";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function categoryName(categories: Category[], categoryId: string) {
  return categories.find((c) => c.id === categoryId)?.name ?? "";
}

function bioGenerateInput(
  form: {
    name: string;
    title: string;
    business: string;
    category_id: string;
  },
  categories: Category[],
): GenerateBioInput {
  const name = form.name.trim();
  const business = form.business.trim() || name;
  return {
    name,
    title: form.title.trim() || "Professional",
    business,
    category: categoryName(categories, form.category_id) || undefined,
  };
}

function canGenerateBio(form: { name: string }) {
  return Boolean(form.name.trim());
}

function CafeCardIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <path d="M8 11h8M8 14h5" />
      <path d="M18 5v2" />
    </svg>
  );
}

export default function SubmitPage() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    business: "",
    email: "",
    phone: "",
    website: "",
    category_id: "",
    bio: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PNG and JPG files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Photo must be under 2MB.");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (photo) formData.append("photo", photo);
      const res = await fetch("/api/submit-card", {
        method: "POST",
        body: formData,
      });
      const text = await res.text();
      let data: { error?: string; success?: boolean } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          res.ok
            ? "Invalid server response."
            : text.slice(0, 120) || `Server error (${res.status}).`,
        );
      }
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitted(true);
      toast.success("Your card has been submitted for review!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-4 ring-amber-100"
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-800"
                aria-hidden
              >
                <CafeCardIcon className="h-10 w-10" />
              </div>
            )}
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-900">
            Submitted for review
          </h2>
          <p className="text-zinc-600">
            Thank you! An admin will review your café card soon.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-semibold text-amber-800 hover:underline"
          >
            ← Back to directory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700"
          >
            ← Back to directory
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold text-zinc-900">
            Submit your café card
          </h1>
          <p className="mt-2 text-zinc-600">
            Your card will be reviewed before it appears in the directory.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                ["Name", "name", true, "text"],
                ["Title", "title", false, "text"],
                ["Company / café", "business", false, "text"],
                ["Email", "email", false, "email"],
                ["Phone", "phone", false, "text"],
              ] as const
            ).map(([label, key, required, type]) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {label}
                  {required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type={type}
                  required={required}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category
              </label>
              <select
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              >
                <option value="">— Optional —</option>
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
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <BioTextarea
                value={form.bio}
                onChange={(bio) => setForm({ ...form, bio })}
                generateInput={bioGenerateInput(form, categories)}
                canGenerate={canGenerateBio(form)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Profile photo{" "}
                <span className="font-normal normal-case text-zinc-400">
                  (optional, PNG/JPG, max 2MB)
                </span>
              </label>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Preview"
                  className="mb-3 h-20 w-20 rounded-full object-cover ring-2 ring-zinc-200"
                />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handlePhotoChange}
                className="w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-amber-700 px-8 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
