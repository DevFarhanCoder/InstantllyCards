import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { getCategoryTree } from "../lib/categoryService";
import type { CategoryNode } from "../types/category";

const { width } = Dimensions.get("window");
const PER_ROW = 4;
const INITIAL_COUNT = 15;
const DEFAULT_CATEGORY_ICON = "\uD83D\uDCC1";

interface ControlItem {
  _id: string;
  name: string;
  isControl: "more";
}

export default function CategoryGrid() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (fresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCategoryTree({ fresh });
      setTree(data);
      console.log("[CATEGORIES] Home categories loaded", {
        count: data.length,
        fresh,
      });
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      return undefined;
    }, [fetchCategories]),
  );

  const rootCategories = tree;
  const displayCategories = rootCategories.slice(0, INITIAL_COUNT);
  const gridItems: (CategoryNode | ControlItem)[] = [...displayCategories];

  const nestedCountById = React.useMemo(() => {
    const map = new Map<string, number>();
    const countDescendants = (node: CategoryNode): number => {
      const activeChildren = (node.children || []).filter(
        (child) => child.isActive !== false,
      );
      const subCount = (node.subcategories || []).filter(Boolean).length;
      let total = subCount;
      for (const child of activeChildren) {
        total += 1 + countDescendants(child);
      }
      map.set(node._id, total);
      return total;
    };

    rootCategories.forEach((root) => countDescendants(root));
    return map;
  }, [rootCategories]);

  if (rootCategories.length > INITIAL_COUNT) {
    gridItems.push({ _id: "__more__", name: "More", isControl: "more" });
  }

  const rows: (CategoryNode | ControlItem)[][] = [];
  for (let i = 0; i < gridItems.length; i += PER_ROW) {
    rows.push(gridItems.slice(i, i + PER_ROW));
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => fetchCategories()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {rows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.row}>
          {row.map((item) => {
            if ("isControl" in item) {
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.item}
                  onPress={() => {
                    console.log(
                      "[CATEGORIES] Home more tapped - opening CategoriesPage",
                    );
                    router.push("/categories");
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="ellipsis-horizontal-circle"
                      size={22}
                      color="#6B7280"
                    />
                  </View>
                  <Text style={styles.label}>{item.name}</Text>
                </TouchableOpacity>
              );
            }

            const node = item as CategoryNode;
            const nestedCount = nestedCountById.get(node._id) || 0;
            return (
              <TouchableOpacity
                key={node._id}
                style={styles.item}
                onPress={() =>
                  router.push({
                    pathname: "/category-focus",
                    params: {
                      rootId: node._id,
                      rootName: node.name,
                      rootIcon: node.icon || DEFAULT_CATEGORY_ICON,
                    },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  {nestedCount > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{nestedCount}</Text>
                    </View>
                  )}
                  <Text style={styles.emojiIcon}>
                    {node.icon || DEFAULT_CATEGORY_ICON}
                  </Text>
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {node.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {row.length < PER_ROW &&
            Array.from({ length: PER_ROW - row.length }).map((_, i) => (
              <View
                key={`empty-${rowIdx}-${i}`}
                style={[styles.item, styles.emptyItem]}
              />
            ))}
        </View>
      ))}

    </View>
  );
}

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
    alignItems: "flex-start",
    width: "100%",
    marginBottom: 0,
  },
  item: {
    flex: 1,
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 0,
    paddingVertical: 0,
    minWidth: width / 5,
    maxWidth: width / 4,
  },
  emptyItem: {
    opacity: 0,
  },
  iconBox: {
    backgroundColor: "transparent",
    borderRadius: 16,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
    position: "relative",
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  emojiIcon: {
    fontSize: 22,
    lineHeight: 26,
  },
  label: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "400",
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 16,
  },
  centered: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
