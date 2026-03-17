import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import FooterCarousel from "../../components/FooterCarousel";
import SubCategoryModal from "../../components/SubCategoryModal";
import { getCategoryChildren, getCategoryTree } from "../../lib/categoryService";
import type { CategoryNode } from "../../types/category";

interface CategoryCardItem {
  type: "category";
  node: CategoryNode;
}

interface SectionMoreItem {
  type: "more";
  id: string;
  rootId: string;
  title: string;
  icon: string;
  hiddenCount: number;
}

type SectionGridItem = CategoryCardItem | SectionMoreItem;

interface CategoryRow {
  id: string;
  items: SectionGridItem[];
}

interface CategorySection {
  id: string;
  title: string;
  icon: string;
  rootId: string;
  totalItems: number;
  data: CategoryRow[];
}

const FALLBACK_ICON = "\uD83D\uDCC1";
const GRID_COLUMNS = 4;
const SECTION_PREVIEW_LIMIT = 8;
const SECTION_PREVIEW_VISIBLE_COUNT = 7;

const toRows = (sectionId: string, items: SectionGridItem[]): CategoryRow[] => {
  const rows: CategoryRow[] = [];
  for (let index = 0; index < items.length; index += GRID_COLUMNS) {
    rows.push({
      id: `${sectionId}-row-${index}`,
      items: items.slice(index, index + GRID_COLUMNS),
    });
  }
  return rows;
};

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
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);

  const listRef = useRef<SectionList<CategoryRow, CategorySection>>(null);
  const tabsRef = useRef<ScrollView>(null);
  const tabLayoutsRef = useRef<Record<string, { x: number; width: number }>>({});
  const tabContainerWidthRef = useRef(0);
  const pendingScrollRef = useRef<{
    sectionIndex: number;
    itemIndex: number;
    sectionId: string;
  } | null>(null);

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

  const sections = useMemo<CategorySection[]>(() => {
    const query = search.trim().toLowerCase();
    return (tree || [])
      .filter((root) => root.isActive !== false)
      .map((root) => {
        const allChildren = (root.children || []).filter(
          (child) => child.isActive !== false,
        );
        const sectionItems = allChildren.length > 0 ? allChildren : [root];
        const rootMatches = root.name.toLowerCase().includes(query);
        const filteredChildren =
          query.length === 0 || rootMatches
            ? sectionItems
            : sectionItems.filter((child) =>
                child.name.toLowerCase().includes(query),
              );

        const allCards: CategoryCardItem[] = filteredChildren.map((child) => ({
          type: "category",
          node: child,
        }));

        const needsMoreCard =
          query.length === 0 && allCards.length > SECTION_PREVIEW_LIMIT;
        const previewItems: SectionGridItem[] = needsMoreCard
          ? [
              ...allCards.slice(0, SECTION_PREVIEW_VISIBLE_COUNT),
              {
                type: "more",
                id: `${root._id}-more`,
                rootId: root._id,
                title: root.name,
                icon: root.icon || FALLBACK_ICON,
                hiddenCount: allCards.length - SECTION_PREVIEW_VISIBLE_COUNT,
              },
            ]
          : allCards;

        return {
          id: root._id,
          rootId: root._id,
          title: root.name,
          icon: root.icon || FALLBACK_ICON,
          totalItems: allCards.length,
          data: toRows(root._id, previewItems),
        };
      })
      .filter((section) => section.totalItems > 0);
  }, [search, tree]);

  useEffect(() => {
    if (!sections.length) {
      setActiveSectionId(null);
      return;
    }

    if (!activeSectionId || !sections.some((s) => s.id === activeSectionId)) {
      setActiveSectionId(sections[0].id);
    }
  }, [activeSectionId, sections]);

  useEffect(() => {
    if (!activeSectionId) return;

    const activeLayout = tabLayoutsRef.current[activeSectionId];
    const containerWidth = tabContainerWidthRef.current;
    if (!activeLayout || containerWidth <= 0) return;

    const targetX = Math.max(
      0,
      activeLayout.x - containerWidth / 2 + activeLayout.width / 2,
    );
    tabsRef.current?.scrollTo({ x: targetX, animated: true });
  }, [activeSectionId]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
    waitForInteraction: false,
  });

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken & { section?: CategorySection }>;
    }) => {
      const visible = viewableItems.find(
        (item) => item.isViewable && item.section?.id,
      );
      if (!visible?.section?.id) return;
      const newSectionId = visible.section.id;
      setActiveSectionId((prev) => (prev === newSectionId ? prev : newSectionId));
    },
  );

  const handleSubcategoryPress = useCallback(
    async (section: CategorySection, item: CategoryNode) => {
      console.log("[CATEGORIES] Subcategory selected", {
        categoryName: section.title,
        categoryId: section.rootId,
        subcategoryName: item.name,
        subcategoryId: item._id,
      });

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
          category: section.title,
          categoryId: section.rootId,
          subcategory: item.name,
          subcategoryId: item._id,
          categoryPath: `${section.title} > ${item.name}`,
        },
      });
    },
    [],
  );

  const handleOpenSectionDetail = useCallback((section: CategorySection) => {
    router.push({
      pathname: "/category-focus",
      params: {
        rootId: section.rootId,
        rootName: section.title,
        rootIcon: section.icon || FALLBACK_ICON,
      },
    });
  }, []);

  const scrollToSection = useCallback((section: CategorySection, index: number) => {
    pendingScrollRef.current = {
      sectionIndex: index,
      itemIndex: 0,
      sectionId: section.id,
    };
    setTimeout(() => {
      listRef.current?.scrollToLocation({
        animated: true,
        sectionIndex: index,
        itemIndex: 0,
        viewOffset: 8,
      });
    }, 0);
  }, []);

  const handleTabPress = useCallback(
    (section: CategorySection, index: number) => {
      setActiveSectionId(section.id);
      scrollToSection(section, index);
    },
    [scrollToSection],
  );

  const handleTabsLayout = useCallback((event: LayoutChangeEvent) => {
    tabContainerWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const handleTabItemLayout = useCallback(
    (sectionId: string, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      tabLayoutsRef.current[sectionId] = { x, width };
    },
    [],
  );

  const handleScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {
      const pending = pendingScrollRef.current;
      if (pending) {
        const resolvedIndex = sections.findIndex(
          (section) => section.id === pending.sectionId,
        );
        const targetIndex =
          resolvedIndex >= 0 ? resolvedIndex : pending.sectionIndex;
        if (targetIndex >= 0 && targetIndex < sections.length) {
          listRef.current?.scrollToLocation({
            sectionIndex: targetIndex,
            itemIndex: pending.itemIndex,
            animated: true,
            viewOffset: 8,
          });
          return;
        }
      }

      const activeIndex = sections.findIndex(
        (section) => section.id === activeSectionId,
      );
      if (activeIndex >= 0) {
        listRef.current?.scrollToLocation({
          sectionIndex: activeIndex,
          itemIndex: 0,
          animated: true,
          viewOffset: 8,
        });
      }
    }, 120);
  }, [activeSectionId, sections]);

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

        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          onLayout={handleTabsLayout}
        >
          {sections.map((section, index) => {
            const isActive = activeSectionId === section.id;
            return (
              <TouchableOpacity
                key={section.id}
                style={styles.tabItem}
                onPress={() => handleTabPress(section, index)}
                activeOpacity={0.8}
                onLayout={(event) => handleTabItemLayout(section.id, event)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {section.title}
                </Text>
                <View
                  style={[
                    styles.tabIndicator,
                    isActive && styles.tabIndicatorActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
        <SectionList
          ref={listRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 120 + tabBarHeight },
          ]}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={16}
          removeClippedSubviews
          onScrollToIndexFailed={handleScrollToIndexFailed}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No categories found</Text>
              <Text style={styles.emptyText}>
                Try a different search keyword.
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item, section }) => (
            <View style={styles.cardRow}>
              {item.items.map((cardItem) => {
                if (cardItem.type === "more") {
                  return (
                    <TouchableOpacity
                      key={cardItem.id}
                      style={[styles.card, styles.moreCard]}
                      onPress={() => handleOpenSectionDetail(section)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.moreDots}>...</Text>
                      <Text style={styles.moreText}>
                        View {cardItem.hiddenCount} more
                      </Text>
                    </TouchableOpacity>
                  );
                }

                const categoryItem = cardItem.node;
                return (
                  <TouchableOpacity
                    key={categoryItem._id}
                    style={styles.card}
                    onPress={() => handleSubcategoryPress(section, categoryItem)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cardIcon}>
                      {getSingleIcon(categoryItem.icon)}
                    </Text>
                    <Text style={styles.cardText} numberOfLines={2}>
                      {categoryItem.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {Array.from({
                length: Math.max(0, GRID_COLUMNS - item.items.length),
              }).map((_, index) => (
                <View
                  key={`${item.id}-placeholder-${index}`}
                  style={[styles.card, styles.cardPlaceholder]}
                />
              ))}
            </View>
          )}
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
  tabsContent: {
    paddingTop: 10,
    paddingBottom: 2,
    gap: 18,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#333333",
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: "#111111",
  },
  tabIndicator: {
    width: "100%",
    height: 2,
    marginTop: 6,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  tabIndicatorActive: {
    backgroundColor: "#007AFF",
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
  sectionHeader: {
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: 0.2,
  },
  cardRow: {
    flexDirection: "row",
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
  moreCard: {
    alignItems: "center",
  },
  moreDots: {
    fontSize: 28,
    color: "#1A1A1A",
    fontWeight: "700",
    marginBottom: 4,
  },
  moreText: {
    fontSize: 11,
    lineHeight: 14,
    color: "#333333",
    fontWeight: "400",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  cardPlaceholder: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
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
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
});
