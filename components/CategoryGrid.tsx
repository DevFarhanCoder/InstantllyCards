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
import SubCategoryModal from "./SubCategoryModal";
import { getCategoryTree } from "../lib/categoryService";
import type { CategoryNode } from "../types/category";

const { width } = Dimensions.get("window");
const PER_ROW = 4;
const INITIAL_COUNT = 8;
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
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);

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
                      size={28}
                      color="#6B7280"
                    />
                  </View>
                  <Text style={styles.label}>{item.name}</Text>
                </TouchableOpacity>
              );
            }

            const node = item as CategoryNode;
            return (
              <TouchableOpacity
                key={node._id}
                style={styles.item}
                onPress={() => setSelectedNode(node)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
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

      <SubCategoryModal
        visible={selectedNode !== null}
        onClose={() => setSelectedNode(null)}
        node={selectedNode}
      />
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
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  label: {
    fontSize: 12,
    color: "#374151",
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
