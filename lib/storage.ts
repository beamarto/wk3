import type { SupabaseClient } from "@supabase/supabase-js";

type StorageClient = Pick<SupabaseClient, "from" | "storage">;
// test
export function getStoragePathFromPublicUrl(url: string): string | null {
  const marker = "/profile-photos/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

function extensionForFile(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export type UploadProfilePhotoResult = {
  url: string | null;
  error: string | null;
};

export async function uploadProfilePhoto(
  supabase: StorageClient,
  cardId: string,
  file: File,
): Promise<UploadProfilePhotoResult> {
  const ext = extensionForFile(file);
  const path = `${cardId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) {
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function saveProfilePhotoUrl(
  supabase: Pick<SupabaseClient, "from">,
  cardId: string,
  photoUrl: string,
): Promise<string | null> {
  const { error } = await supabase
    .from("cards")
    .update({ profile_photo_url: photoUrl })
    .eq("id", cardId);

  return error?.message ?? null;
}
