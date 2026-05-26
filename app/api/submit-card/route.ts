import { getSupabaseKey, getSupabaseUrl } from "@/lib/env";
import { saveProfilePhotoUrl, uploadProfilePhoto } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createAnonClient() {
  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseCategoryId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const title = (formData.get("title") as string) || "";
    const email = (formData.get("email") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const website = (formData.get("website") as string) || "";
    const categoryId = parseCategoryId(formData.get("category_id"));
    const bio = ((formData.get("bio") as string) || "").trim() || null;
    const photo = formData.get("photo");

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const supabase = createAnonClient();
    const sessionId = crypto.randomUUID();

    const { data: card, error: insertError } = await supabase
      .from("cards")
      .insert([
        {
          name: name.trim(),
          title,
          email,
          phone,
          website,
          category_id: categoryId,
          bio,
          status: "pending",
          session_id: sessionId,
        },
      ])
      .select()
      .single();

    if (insertError || !card) {
      console.error("submit-card insert error:", insertError);
      return NextResponse.json(
        {
          error:
            insertError?.message ||
            "Could not save submission. Check Supabase RLS and table columns (status, session_id).",
        },
        { status: 500 },
      );
    }

    let photoUrl: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      const upload = await uploadProfilePhoto(supabase, card.id, photo);
      if (upload.error) {
        console.error("Photo upload failed:", upload.error);
      } else if (upload.url) {
        photoUrl = upload.url;
        const linkError = await saveProfilePhotoUrl(
          supabase,
          card.id,
          upload.url,
        );
        if (linkError) {
          console.error("Could not save profile_photo_url:", linkError);
        } else {
          photoUrl = upload.url;
        }
      }
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://wk3-ten.vercel.app";
        const adminUrl = `${siteUrl}/admin/submissions`;

        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: process.env.ADMIN_EMAIL || "marlenial2002@gmail.com",
          subject: `New café card submission: ${name}`,
          html: `
            <h2>New submission received</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Title:</strong> ${title || "—"}</p>
            <p><strong>Email:</strong> ${email || "—"}</p>
            <p><strong>Phone:</strong> ${phone || "—"}</p>
            <p><strong>Website:</strong> ${website || "—"}</p>
            <p><strong>Bio:</strong> ${bio || "—"}</p>
            ${photoUrl ? `<p><img src="${photoUrl}" width="120" style="border-radius:50%"/></p>` : ""}
            <p><a href="${adminUrl}">Review submission</a></p>
          `,
        });
      } catch (emailErr) {
        console.error("Resend email failed (submission still saved):", emailErr);
      }
    }

    return NextResponse.json({ success: true, id: card.id });
  } catch (err: unknown) {
    console.error("submit-card crash:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json(
      {
        error: message.includes("Missing NEXT_PUBLIC")
          ? `${message} Add Supabase env vars on Vercel.`
          : message,
      },
      { status: 500 },
    );
  }
}
