export function getStoragePathFromPublicUrl(url: string): string | null {
  const marker = "/profile-photos/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

export async function uploadProfilePhoto(
  supabase: {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          body: ArrayBuffer,
          options: { contentType: string; upsert: boolean },
        ) => Promise<{ error: { message: string } | null }>;
        getPublicUrl: (path: string) => { data: { publicUrl: string } };
      };
    };
  },
  cardId: string,
  file: File,
): Promise<string | null> {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${cardId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("profile-photos")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (error) return null;

  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  return data.publicUrl;
}
