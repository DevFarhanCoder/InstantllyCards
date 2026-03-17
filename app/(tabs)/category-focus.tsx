import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import FooterCarousel from "../../components/FooterCarousel";
import SubCategoryModal from "../../components/SubCategoryModal";
import { getCategoryChildren, getCategoryTree } from "../../lib/categoryService";
import type { CategoryNode } from "../../types/category";

const FALLBACK_ICON = "\uD83D\uDCC1";
const GRID_COLUMNS = 4;

const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const getSingleIcon = (icon?: string) => {
  const trimmedIcon = icon?.trim();
  if (!trimmedIcon) {
    return FALLBACK_ICON;
  }

  const [firstToken] = trimmedIcon.split(/\s+/);
  return Array.from(firstToken || "")[0] || FALLBACK_ICON;
};

export default function CategoryFocusPage() {
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams<{
    rootId?: string;
    rootName?: string;
  }>();

  const rootId = getParam(params.rootId);
  const rootNameParam = getParam(params.rootName) || "Category";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rootNode, setRootNode] = useState<CategoryNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);

  const fetchRoot = useCallback(async () => {
    if (!rootId) {
      setError("Invalid category");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tree = await getCategoryTree();
      const root = tree.find((item) => item._id === rootId) || null;
      if (!root) {
        setError("Category not found");
      }
      setRootNode(root);
      console.log("[CATEGORIES] Focus page loaded", {
        rootId,
        rootName: root?.name,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load category");
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  useEffect(() => {
    fetchRoot();
  }, [fetchRoot]);

  useFocusEffect(
    useCallback(() => {
      fetchRoot();
      return undefined;
    }, [fetchRoot]),
  );

  const displayItems = useMemo(() => {
    if (!rootNode) return [];
    const base =
      (rootNode.children || []).filter((item) => item.isActive !== false)
        .length > 0
        ? (rootNode.children || []).filter((item) => item.isActive !== false)
        : [rootNode];
    const query = search.trim().toLowerCase();
    if (!query) return base;
    return base.filter((item) => item.name.toLowerCase().includes(query));
  }, [rootNode, search]);

  const gridData = useMemo(() => {
    const remainder = displayItems.length % GRID_COLUMNS;
    if (remainder === 0) return displayItems;
    return [
      ...displayItems,
      ...Array.from({ length: GRID_COLUMNS - remainder }, () => null),
    ] as Array<CategoryNode | null>;
  }, [displayItems]);

  const handleCategoryPress = useCallback(
    async (item: CategoryNode) => {
      if (!rootNode) return;

      const knownChildren = (item.children || []).filter(
        (child) => child.isActive !== false,
      );
      if (knownChildren.length > 0) {
        setSelectedNode({ ...item, children: knownChildren });
        return;
      }

      try {
        const lazyChildren = await getCategoryChildren(item._id);
        if (lazyChildren.length > 0) {
          setSelectedNode({ ...item, children: lazyChildren });
          return;
        }
      } catch {
        // no-op
      }

      router.push({
        pathname: "/business-cards",
        params: {
          category: rootNode.name,
          categoryId: rootNode._id,
          subcategory: item.name,
          subcategoryId: item._id,
          categoryPath: `${rootNode.name} > ${item.name}`,
        },
      });
    },
    [rootNode],
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {rootNode?.name || rootNameParam}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nested categories"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color="#007AFF" size="large" />
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchRoot()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={gridData}
          keyExtractor={(item, index) =>
            item ? item._id : `placeholder-${index.toString()}`
          }
          numColumns={GRID_COLUMNS}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 120 + tabBarHeight },
          ]}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No categories found</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (!item) {
              return <View style={[styles.card, styles.placeholderCard]} />;
            }

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => handleCategoryPress(item)}
              >
                <Text style={styles.cardIcon}>{getSingleIcon(item.icon)}</Text>
                <Text style={styles.cardText} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <FooterCarousel showPromoteButton={true} />

      <SubCategoryModal
        visible={selectedNode !== null}
        onClose={() => setSelectedNode(null)}
        node={selectedNode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: 0.2,
    maxWidth: "85%",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
    marginLeft: 8,
    marginRight: 8,
  },
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  row: {
    columnGap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    paddingHorizontal: 8,
    paddingVertical: 12,
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0,
  },
  placeholderCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardIcon: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 11,
    lineHeight: 14,
    color: "#333333",
    fontWeight: "400",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  emptyContainer: {
    paddingTop: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
});
