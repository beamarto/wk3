import { isAdminEmail } from "@/lib/admin-email";
import { createClient } from "@/lib/supabase-server";
import { saveProfilePhotoUrl, uploadProfilePhoto } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCategoryId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in with Google first." }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json(
      { error: "Only the admin account can add or edit cards." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();
    const id = (formData.get("id") as string | null)?.trim() || null;
    const name = (formData.get("name") as string)?.trim();
    const title = (formData.get("title") as string) || "";
    const email = (formData.get("email") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const website = (formData.get("website") as string) || "";
    const categoryId = parseCategoryId(formData.get("category_id"));
    const bio = ((formData.get("bio") as string) || "").trim() || null;
    const photo = formData.get("photo");

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    let cardId = id;

    if (id) {
      const { error } = await supabase
        .from("cards")
        .update({
          name,
          title,
          email,
          phone,
          website,
          category_id: categoryId,
          bio,
        })
        .eq("id", id);

      if (error) {
        console.error("admin save-card update:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("cards")
        .insert([
          {
            name,
            title,
            email,
            phone,
            website,
            category_id: categoryId,
            bio,
            status: "approved",
            approved_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (error || !inserted) {
        console.error("admin save-card insert:", error);
        return NextResponse.json(
          { error: error?.message || "Could not save card." },
          { status: 500 },
        );
      }
      cardId = inserted.id;
    }

    let photoWarning: string | null = null;
    if (photo instanceof File && photo.size > 0 && cardId) {
      const upload = await uploadProfilePhoto(supabase, cardId, photo);
      if (upload.error) {
        photoWarning = `Card saved, but photo upload failed: ${upload.error}`;
      } else if (upload.url) {
        const linkError = await saveProfilePhotoUrl(supabase, cardId, upload.url);
        if (linkError) {
          photoWarning = `Card saved, but photo could not be linked: ${linkError}`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      id: cardId,
      photoWarning,
    });
  } catch (err) {
    console.error("admin save-card crash:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 },
    );
  }
}
