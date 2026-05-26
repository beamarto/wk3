export type Category = {
  id: string;
  name: string;
  color: string;
};

export type CardWithCategory = {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  category_id: string;
  categories: Pick<Category, "name" | "color"> | null;
};
