import { getSupabaseKey, getSupabaseUrl } from "@/lib/env";
import { saveProfilePhotoUrl, uploadProfilePhoto } from "@/lib/storage";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const title = (formData.get("title") as string) || "";
    const email = (formData.get("email") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const website = (formData.get("website") as string) || "";
    const categoryId = (formData.get("category_id") as string) || null;
    const photo = formData.get("photo") as File | null;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseKey(), {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.delete({ name, ...options });
        },
      },
    });

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
          status: "pending",
          session_id: sessionId,
        },
      ])
      .select()
      .single();

    if (insertError || !card) {
      return NextResponse.json(
        { error: insertError?.message || "Insert failed." },
        { status: 500 },
      );
    }

    let photoUrl: string | null = null;
    if (photo && photo.size > 0) {
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
          photoUrl = null;
        }
      }
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
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
          ${photoUrl ? `<p><img src="${photoUrl}" width="120" style="border-radius:50%"/></p>` : ""}
          <p><a href="${adminUrl}">Review submission</a></p>
        `,
      });
    }

    return NextResponse.json({ success: true, id: card.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
