import api from "./api";

export type CategorySummary = {
  _id: string;
  name: string;
  icon?: string;
  order?: number;
  subcategoryCount?: number;
  updatedAt?: string;
};

type CategorySummaryResponse = {
  success: boolean;
  data?: CategorySummary[];
};

type CategorySubcategoriesPayload = {
  categoryId: string;
  categoryName: string;
  subcategories: string[];
};

type CategorySubcategoriesResponse = {
  success: boolean;
  data?: CategorySubcategoriesPayload;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    search: string | null;
  };
};

export const categoryQueryKeys = {
  summaries: ["mobile-category-summaries"] as const,
  subcategories: (categoryId: string) =>
    ["mobile-category-subcategories", categoryId] as const,
};

async function fetchCategorySummariesWithOptions(options?: {
  forceRefresh?: boolean;
}): Promise<CategorySummary[]> {
  const forceRefresh = options?.forceRefresh ?? true;
  const cacheBust = Date.now();

  console.log("[CATEGORIES] Fetching mobile category summaries", {
    forceRefresh,
    cacheBust: forceRefresh ? cacheBust : null,
  });

  const response = await api.get<CategorySummaryResponse>("/categories/mobile", {
    params: forceRefresh
      ? {
          fresh: 1,
          t: cacheBust,
        }
      : undefined,
  });
  if (!response?.success || !Array.isArray(response.data)) {
    console.warn("[CATEGORIES] Invalid summary response shape");
    return [];
  }

  const summaries = response.data
    .filter((category) => Boolean(category?._id) && Boolean(category?.name))
    .map((category) => ({
      ...category,
      name: String(category.name).trim(),
      subcategoryCount: Number(category.subcategoryCount || 0),
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  console.log("[CATEGORIES] Category summaries loaded", {
    count: summaries.length,
  });

  return summaries;
}

export async function fetchCategorySummaries(): Promise<CategorySummary[]> {
  return fetchCategorySummariesWithOptions({ forceRefresh: true });
}

export async function fetchCategorySubcategories(
  categoryId: string,
  options?: { page?: number; limit?: number; search?: string; forceRefresh?: boolean },
): Promise<CategorySubcategoriesPayload> {
  const forceRefresh = options?.forceRefresh ?? true;
  const cacheBust = Date.now();

  console.log("[CATEGORIES] Fetching subcategories", {
    categoryId,
    page: options?.page || 1,
    limit: options?.limit || 200,
    search: options?.search || "",
    forceRefresh,
  });

  const response = await api.get<CategorySubcategoriesResponse>(
    `/categories/mobile/${encodeURIComponent(categoryId)}/subcategories`,
    {
      params: {
        page: options?.page || 1,
        limit: options?.limit || 200,
        search: options?.search || "",
        fresh: forceRefresh ? 1 : 0,
        t: forceRefresh ? cacheBust : undefined,
      },
    },
  );

  if (!response?.success || !response.data) {
    throw new Error("Failed to fetch subcategories");
  }

  const payload = {
    categoryId: response.data.categoryId,
    categoryName: response.data.categoryName,
    subcategories: Array.isArray(response.data.subcategories)
      ? response.data.subcategories
      : [],
  };

  console.log("[CATEGORIES] Subcategories loaded", {
    categoryId: payload.categoryId,
    categoryName: payload.categoryName,
    count: payload.subcategories.length,
  });

  return payload;
}
