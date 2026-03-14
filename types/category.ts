export interface CategoryNode {
  _id: string;
  name: string;
  icon: string;
  parent_id?: string | null;
  level: number;
  order: number;
  isActive: boolean;
  subcategories?: string[];
  children: CategoryNode[];
}
