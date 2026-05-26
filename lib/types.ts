export type Category = {
  id: string;
  name: string;
  color: string;
};

export type CardStatus = "pending" | "approved" | "rejected";

export type CardWithCategory = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  category_id: string | null;
  status?: CardStatus;
  profile_photo_url?: string | null;
  approved_at?: string | null;
  session_id?: string | null;
  bio?: string | null;
  categories: Pick<Category, "name" | "color"> | null;
};
