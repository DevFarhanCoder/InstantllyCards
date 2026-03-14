import api from "./api";
import type { CategoryNode } from "../types/category";

interface CategoryTreeResponse {
  success: boolean;
  data: CategoryNode[];
}

const compareCategoryNodes = (a: CategoryNode, b: CategoryNode) => {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  return a.name.localeCompare(b.name);
};

const normalizeTree = (nodes: CategoryNode[]): CategoryNode[] => {
  return [...nodes]
    .sort(compareCategoryNodes)
    .map((node) => ({
      ...node,
      children: normalizeTree(node.children || []),
    }));
};

export async function getCategoryTree(options?: {
  fresh?: boolean;
}): Promise<CategoryNode[]> {
  const res = await api.get<CategoryTreeResponse>("/categories/tree", {
    params: options?.fresh ? { fresh: "1" } : undefined,
  });
  if (!res?.success || !Array.isArray(res.data)) {
    throw new Error("Failed to load categories");
  }
  return normalizeTree(res.data);
}

export async function getCategoryChildren(
  categoryId: string,
  options?: { fresh?: boolean },
): Promise<CategoryNode[]> {
  const res = await api.get<CategoryTreeResponse>(
    `/categories/${categoryId}/children`,
    {
      params: options?.fresh ? { fresh: "1" } : undefined,
    },
  );
  if (!res?.success || !Array.isArray(res.data)) {
    return [];
  }
  return normalizeTree(res.data);
}
