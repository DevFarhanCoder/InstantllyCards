import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import SubCategoryModal from "./SubCategoryModal";
import {
  categoryQueryKeys,
  fetchCategorySubcategories,
  fetchCategorySummaries,
  type CategorySummary,
} from "../lib/categories";

type CategoryGridItem = {
  _id: string;
  name: string;
  icon?: string;
  isPlus?: boolean;
  isShowLess?: boolean;
};

const EMOJI_ICON_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

const isEmojiIcon = (icon?: string): boolean => {
  if (!icon) return false;
  const normalized = String(icon).trim();
  if (!normalized) return false;
  return EMOJI_ICON_REGEX.test(normalized);
};

const renderCategoryIcon = (categoryName: string, icon?: string) => {
  if (isEmojiIcon(icon)) {
    return <Text style={styles.emojiIcon}>{String(icon).trim()}</Text>;
  }

  switch (categoryName.toLowerCase()) {
    case "automotive":
      return <FontAwesome5 name="car" size={28} color="#6B7280" />;
    case "business":
      return <MaterialIcons name="business-center" size={28} color="#6B7280" />;
    case "construction":
      return <FontAwesome5 name="tools" size={28} color="#6B7280" />;
    case "education":
      return <Ionicons name="school" size={28} color="#6B7280" />;
    case "health":
      return <Ionicons name="medkit" size={28} color="#6B7280" />;
    case "lifestyle":
      return <MaterialIcons name="style" size={28} color="#6B7280" />;
    case "rentals":
      return <FontAwesome5 name="key" size={28} color="#6B7280" />;
    case "shopping":
      return <MaterialIcons name="shopping-cart" size={28} color="#6B7280" />;
    case "technology":
      return <Ionicons name="laptop" size={28} color="#6B7280" />;
    case "travel":
      return <FontAwesome5 name="plane" size={28} color="#6B7280" />;
    case "services":
      return <MaterialIcons name="miscellaneous-services" size={28} color="#6B7280" />;
    default:
      return <MaterialIcons name="category" size={28} color="#6B7280" />;
  }
};

const styles = StyleSheet.create({
  gridContainer: {
    marginTop: 0,
    marginBottom: 8,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 0,
  },
  item: {
    flex: 1,
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 0,
    paddingVertical: 0,
    minWidth: Dimensions.get("window").width / 5,
    maxWidth: Dimensions.get("window").width / 4,
  },
  iconBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 10,
    marginBottom: 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 48,
    minWidth: 48,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  emojiIcon: {
    fontSize: 28,
    lineHeight: 30,
  },
  loadingContainer: {
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    width: "100%",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#6B7280",
  },
  retryText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
});

export default function CategoryGrid() {
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = React.useState(false);
  const [modal, setModal] = React.useState<{
    visible: boolean;
    title: string;
    categoryName: string;
    categoryId: string;
    subcategories: string[];
    loading: boolean;
    error: string | null;
  }>({
    visible: false,
    title: "",
    categoryName: "",
    categoryId: "",
    subcategories: [],
    loading: false,
    error: null,
  });

  const categoriesQuery = useQuery({
    queryKey: categoryQueryKeys.summaries,
    queryFn: fetchCategorySummaries,
    staleTime: 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const categories = React.useMemo<CategorySummary[]>(
    () => categoriesQuery.data || [],
    [categoriesQuery.data],
  );

  const categoryMap = React.useMemo(
    () => new Map(categories.map((category) => [category._id, category])),
    [categories],
  );

  const openCategoryModal = React.useCallback(
    async (category: CategorySummary) => {
      console.log("[CATEGORIES] Category selected", {
        categoryId: category._id,
        categoryName: category.name,
      });
      const title = `${category.name} Categories`;
      setModal({
        visible: true,
        title,
        categoryName: category.name,
        categoryId: category._id,
        subcategories: [],
        loading: true,
        error: null,
      });

      try {
        const response = await queryClient.fetchQuery({
          queryKey: categoryQueryKeys.subcategories(category._id),
          queryFn: () => fetchCategorySubcategories(category._id),
          staleTime: 60 * 1000,
          gcTime: 30 * 60 * 1000,
        });

        setModal((prev) => ({
          ...prev,
          subcategories: response.subcategories,
          loading: false,
          error: null,
        }));
      } catch (error: any) {
        console.error("[CATEGORIES] Failed to load subcategories", {
          categoryId: category._id,
          error: error?.message || String(error),
        });
        setModal((prev) => ({
          ...prev,
          loading: false,
          error:
            error?.message || "Unable to load subcategories. Please try again.",
        }));
      }
    },
    [queryClient],
  );

  const handleRetrySubcategories = React.useCallback(() => {
    const category = categoryMap.get(modal.categoryId);
    if (!category) return;
    openCategoryModal(category);
  }, [categoryMap, modal.categoryId, openCategoryModal]);

  const initialCount = 5;
  const perRow = 4;

  const showPlus = !showMore && categories.length > initialCount;
  const displayCategories = showMore
    ? categories
    : categories.slice(0, initialCount);

  const gridItems: CategoryGridItem[] = [
    ...displayCategories.map((category) => ({
      _id: category._id,
      name: category.name,
      icon: category.icon,
    })),
  ];

  if (showPlus) {
    gridItems.push({
      _id: "more",
      name: "More",
      isPlus: true,
    });
  }

  const rows: CategoryGridItem[][] = [];
  for (let index = 0; index < gridItems.length; index += perRow) {
    rows.push(gridItems.slice(index, index + perRow));
  }

  let showLessInserted = false;
  if (showMore) {
    if (rows.length >= 3) {
      const thirdRow = rows[2];
      const travelIndex = thirdRow.findIndex(
        (category) => category.name === "Travel",
      );

      if (travelIndex !== -1) {
        thirdRow.splice(travelIndex + 1, 0, {
          _id: "showless-btn",
          name: "ShowLess",
          isShowLess: true,
        });
        showLessInserted = true;
      }
    }

    if (!showLessInserted) {
      rows.push([
        {
          _id: "showless-btn-fallback",
          name: "ShowLess",
          isShowLess: true,
        },
      ]);
    }
  }

  if (categoriesQuery.isLoading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6B7280" />
      </View>
    );
  }

  if (categoriesQuery.isError && categories.length === 0) {
    return (
      <TouchableOpacity
        style={styles.errorContainer}
        onPress={() => categoriesQuery.refetch()}
        activeOpacity={0.8}
      >
        <Text style={styles.errorText}>Unable to load categories</Text>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((category) => {
            if (category.isPlus) {
              return (
                <TouchableOpacity
                  key={category._id}
                  style={styles.item}
                  onPress={() => setShowMore(true)}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name="add-circle" size={28} color="#6B7280" />
                  </View>
                  <Text style={styles.label}>More</Text>
                </TouchableOpacity>
              );
            }

            if (category.isShowLess) {
              return (
                <TouchableOpacity
                  key={category._id}
                  style={styles.item}
                  onPress={() => setShowMore(false)}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name="remove-circle" size={28} color="#6B7280" />
                  </View>
                  <Text style={styles.label}>Show Less</Text>
                </TouchableOpacity>
              );
            }

            const sourceCategory = categoryMap.get(category._id);
            const isCategoryLoading =
              modal.loading && modal.categoryId === category._id;
            const resolvedIcon = sourceCategory?.icon || category.icon;

            return (
              <TouchableOpacity
                key={category._id}
                style={styles.item}
                onPress={() => {
                  if (!sourceCategory) return;
                  openCategoryModal(sourceCategory);
                }}
                disabled={!sourceCategory}
              >
                <View style={styles.iconBox}>
                  {isCategoryLoading ? (
                    <ActivityIndicator size="small" color="#6B7280" />
                  ) : (
                    renderCategoryIcon(category.name, resolvedIcon)
                  )}
                </View>
                <Text style={styles.label}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}

          {row.length < perRow &&
            Array.from({ length: perRow - row.length }).map((_, index) => (
              <View
                key={`empty-${index}`}
                style={[styles.item, { backgroundColor: "transparent" }]}
              />
            ))}
        </View>
      ))}

      <SubCategoryModal
        visible={modal.visible}
        onClose={() =>
          setModal((prev) => ({
            ...prev,
            visible: false,
            loading: false,
            error: null,
          }))
        }
        title={modal.title}
        categoryName={modal.categoryName}
        subcategories={modal.subcategories}
        loading={modal.loading}
        error={modal.error}
        onRetry={handleRetrySubcategories}
      />
    </View>
  );
}
