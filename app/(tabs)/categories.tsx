import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import FooterCarousel from "../../components/FooterCarousel";
import { getCategoryTree } from "../../lib/categoryService";
import type { CategoryNode } from "../../types/category";

const FALLBACK_ICON = "\uD83D\uDCC1";
const GRID_COLUMNS = 4;
const BASE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LIST_PADDING_LEFT = 16;
const LIST_PADDING_RIGHT = 24;
const CARD_GAP = 10;
const ROW_GAP = 10;
const LIST_PADDING_TOP = 14;
const LIST_PADDING_BOTTOM = 24;
const ALPHABET_CENTER_OFFSET = -22;

const getSingleIcon = (icon?: string) => {
  const trimmedIcon = icon?.trim();
  if (!trimmedIcon) {
    return FALLBACK_ICON;
  }

  const [firstToken] = trimmedIcon.split(/\s+/);
  return Array.from(firstToken || "")[0] || FALLBACK_ICON;
};

export default function CategoriesPage() {
  const tabBarHeight = useBottomTabBarHeight();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [visibleSectionIds, setVisibleSectionIds] = useState<string[]>([]);
  const [listHeight, setListHeight] = useState(0);
  const [alphabetHeight, setAlphabetHeight] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);

  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<CategoryNode>>(null);
  const dataRef = useRef<CategoryNode[]>([]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCategoryTree();
      setTree(data);
      console.log("[CATEGORIES] CategoriesPage loaded tree", {
        count: data.length,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load categories");
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

  const getLetterBucket = useCallback((name: string) => {
    const firstChar = name.trim().charAt(0);
    if (!firstChar) return "#";
    const upper = firstChar.toUpperCase();
    return upper >= "A" && upper <= "Z" ? upper : "#";
  }, []);

  const activeRoots = useMemo(
    () => (tree || []).filter((root) => root.isActive !== false),
    [tree],
  );

  const filteredRoots = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeRoots;
    return activeRoots.filter((root) =>
      root.name.toLowerCase().includes(query),
    );
  }, [activeRoots, search]);

  const sortedRoots = useMemo(
    () =>
      [...filteredRoots].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [filteredRoots],
  );

  const nestedCountById = useMemo(() => {
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

    sortedRoots.forEach((root) => countDescendants(root));
    return map;
  }, [sortedRoots]);

  useEffect(() => {
    dataRef.current = sortedRoots;
  }, [sortedRoots]);

  const alphabetList = useMemo(() => {
    let hasOther = false;
    sortedRoots.forEach((root) => {
      if (getLetterBucket(root.name) === "#") {
        hasOther = true;
      }
    });
    return hasOther ? [...BASE_ALPHABET, "#"] : BASE_ALPHABET;
  }, [getLetterBucket, sortedRoots]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
    waitForInteraction: false,
  });

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken & { item?: CategoryNode }>;
    }) => {
      const letters = Array.from(
        new Set(
          viewableItems
            .filter((item) => item.isViewable && item.item?.name)
            .map((item) => getLetterBucket(item.item?.name || "")),
        ),
      );
      setVisibleSectionIds(letters);
    },
  );

  const handleOpenSectionDetail = useCallback((item: CategoryNode) => {
    router.push({
      pathname: "/category-focus",
      params: {
        rootId: item._id,
        rootName: item.name,
        rootIcon: item.icon || FALLBACK_ICON,
        returnTo: "/categories",
      },
    });
  }, []);

  const letterIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    sortedRoots.forEach((item, index) => {
      const letter = getLetterBucket(item.name);
      if (map[letter] === undefined) {
        map[letter] = index;
      }
    });
    return map;
  }, [getLetterBucket, sortedRoots]);

  const handleAlphabetPress = useCallback(
    (letter: string) => {
      const currentData = dataRef.current;
      const index = currentData.findIndex(
        (item) => getLetterBucket(item.name) === letter,
      );
      if (
        index < 0 ||
        index >= currentData.length ||
        currentData.length === 0
      ) {
        return;
      }
      setVisibleSectionIds([letter]);
      const rowIndex = Math.floor(index / GRID_COLUMNS);
      const estimatedRowHeight = (cardHeight || 120) + ROW_GAP;
      const offset = rowIndex * estimatedRowHeight + LIST_PADDING_TOP;
      listRef.current?.scrollToOffset({ offset, animated: true });
    },
    [cardHeight, getLetterBucket],
  );

  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height);
  }, []);

  const handleAlphabetLayout = useCallback((event: LayoutChangeEvent) => {
    setAlphabetHeight(event.nativeEvent.layout.height);
  }, []);

  const cardWidth = useMemo(() => {
    const availableWidth =
      windowWidth - LIST_PADDING_LEFT - LIST_PADDING_RIGHT;
    const totalGap = CARD_GAP * (GRID_COLUMNS - 1);
    const width = (availableWidth - totalGap) / GRID_COLUMNS;
    return Math.max(0, Math.floor(width));
  }, [windowWidth]);

  const alphabetTop = useMemo(() => {
    if (listHeight <= 0 || alphabetHeight <= 0) return 0;
    return Math.max(
      0,
      (listHeight - alphabetHeight) / 2 + ALPHABET_CENTER_OFFSET,
    );
  }, [alphabetHeight, listHeight]);

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
          <Text style={styles.headerTitle}>Categories</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories"
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

      <View style={styles.listWrap} onLayout={handleListLayout}>
        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator color="#007AFF" size="large" />
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => fetchCategories()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={sortedRoots}
            keyExtractor={(item) => item._id}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.cardRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: LIST_PADDING_BOTTOM + 120 + tabBarHeight },
            ]}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={8}
            updateCellsBatchingPeriod={16}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No categories found</Text>
                <Text style={styles.emptyText}>
                  Try a different search keyword.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { width: cardWidth }]}
                onPress={() => handleOpenSectionDetail(item)}
                activeOpacity={0.75}
                onLayout={(event) => {
                  if (cardHeight === 0) {
                    setCardHeight(event.nativeEvent.layout.height);
                  }
                }}
              >
                {(() => {
                  const count = nestedCountById.get(item._id) || 0;
                  if (count <= 0) return null;
                  return (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                  );
                })()}
                <Text style={styles.cardIcon}>{getSingleIcon(item.icon)}</Text>
                <Text style={styles.cardText} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {sortedRoots.length > 0 && (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            <View
              pointerEvents="auto"
              onLayout={handleAlphabetLayout}
              style={[
                styles.alphabetIndex,
                { top: alphabetTop, right: 8 },
              ]}
            >
              {alphabetList.map((letter) => {
                const isActive = visibleSectionIds.includes(letter);
                const isDisabled = letterIndexMap[letter] === undefined;
                return (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => handleAlphabetPress(letter)}
                    activeOpacity={0.7}
                    disabled={isDisabled}
                    style={styles.alphabetItem}
                  >
                    <Text
                      style={[
                        styles.alphabetText,
                        isDisabled && styles.alphabetTextDisabled,
                        isActive && styles.alphabetTextActive,
                      ]}
                    >
                      {letter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <FooterCarousel showPromoteButton={true} />
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
    paddingBottom: 8,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
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
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingLeft: LIST_PADDING_LEFT,
    paddingRight: LIST_PADDING_RIGHT,
    paddingTop: LIST_PADDING_TOP,
    paddingBottom: LIST_PADDING_BOTTOM,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    columnGap: CARD_GAP,
    marginBottom: ROW_GAP,
  },
  card: {
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
    flexGrow: 0,
    flexShrink: 0,
    position: "relative",
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
  countBadge: {
    position: "absolute",
    top: 6,
    right: 6,
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
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
  alphabetIndex: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
  },
  alphabetItem: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  alphabetText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  alphabetTextActive: {
    color: "#111111",
  },
  alphabetTextDisabled: {
    color: "#D1D5DB",
  },
});
