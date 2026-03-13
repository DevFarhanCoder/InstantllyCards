import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../lib/api';
import type { CategoryNode } from './CategoryGrid';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  node: CategoryNode | null; // the parent node whose children we display
}

// ─────────────────────────────────────────────────────────────
// Breadcrumb entry
// ─────────────────────────────────────────────────────────────
interface Crumb {
  node: CategoryNode;
  children: CategoryNode[];
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function SubCategoryModal({ visible, onClose, node }: Props) {
  const [search, setSearch] = useState('');
  const [stack, setStack] = useState<Crumb[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Initialise stack whenever the root node changes
  useEffect(() => {
    if (!visible || !node) {
      setStack([]);
      setSearch('');
      return;
    }
    // Seed stack with the root node + its already-loaded children
    setStack([{ node, children: node.children ?? [] }]);
    setSearch('');
  }, [visible, node]);

  // Current level = top of stack
  const current = stack[stack.length - 1] ?? null;

  // ── Fetch children on-demand (if not already loaded) ──
  const fetchChildren = useCallback(async (targetNode: CategoryNode): Promise<CategoryNode[]> => {
    // Already loaded in tree
    if (targetNode.children && targetNode.children.length > 0) {
      return targetNode.children;
    }
    setLoadingId(targetNode._id);
    try {
      const res = await api.get<{ success: boolean; data: CategoryNode[] }>(
        `/categories/${targetNode._id}/children`
      );
      return res?.success && Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    } finally {
      setLoadingId(null);
    }
  }, []);

  // ── Handle pressing a child node ──
  const handleChildPress = async (child: CategoryNode) => {
    // If this child has sub-categories → drill down
    const hasChildren =
      (child.children && child.children.length > 0) ||
      // We don't know yet — check subcategoryCount or just try fetching
      child.level < 3; // allow up to level 3 depth exploration

    // Always try fetching children; if none → go to business-cards
    const children = await fetchChildren(child);

    if (children.length > 0) {
      setStack((prev) => [...prev, { node: child, children }]);
      setSearch('');
    } else {
      // Leaf node → navigate to business cards
      const categoryPath = [...stack.map((s) => s.node.name), child.name].join(' > ');
      router.push({
        pathname: '/business-cards',
        params: {
          subcategory: child.name,
          subcategoryId: child._id,
          category: stack[0]?.node.name ?? child.name,
          categoryId: stack[0]?.node._id ?? child._id,
          categoryPath,
        },
      });
      handleClose();
    }
  };

  // ── Navigate back one level ──
  const handleBack = () => {
    if (stack.length <= 1) {
      handleClose();
    } else {
      setStack((prev) => prev.slice(0, -1));
      setSearch('');
    }
  };

  const handleClose = () => {
    setStack([]);
    setSearch('');
    onClose();
  };

  // ── Filtered list ──
  const allItems = current?.children ?? [];
  const filtered = search.trim()
    ? allItems.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  // ── Title ──
  const title = current?.node.name ?? '';

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={false}
      onRequestClose={handleBack}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.titleEmoji}>{current?.node.icon ?? '📁'}</Text>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
          </View>

          {/* ── Breadcrumb ── */}
          {stack.length > 1 && (
            <View style={styles.breadcrumbRow}>
              {stack.map((crumb, idx) => (
                <React.Fragment key={crumb.node._id}>
                  {idx > 0 && (
                    <Ionicons name="chevron-forward" size={12} color="#9CA3AF" style={styles.breadcrumbChevron} />
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setStack((prev) => prev.slice(0, idx + 1));
                      setSearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.breadcrumbText,
                        idx === stack.length - 1 && styles.breadcrumbActive,
                      ]}
                      numberOfLines={1}
                    >
                      {crumb.node.name}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Results count ── */}
        {search.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </Text>
          </View>
        )}

        {/* ── List ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {search ? 'No results found' : 'No sub-categories yet'}
              </Text>
              {search ? (
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const hasKnownChildren =
              (item.children && item.children.length > 0);
            const isLoading = loadingId === item._id;

            return (
              <TouchableOpacity
                style={styles.subcategoryItem}
                onPress={() => handleChildPress(item)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.itemEmoji}>{item.icon || '📁'}</Text>
                </View>

                {/* Name + child count */}
                <View style={styles.textContainer}>
                  <Text style={styles.subcategoryText} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {hasKnownChildren && (
                    <Text style={styles.childCount}>
                      {item.children.length} sub-categor{item.children.length === 1 ? 'y' : 'ies'}
                    </Text>
                  )}
                </View>

                {/* Arrow / Loader */}
                <View style={styles.arrowContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : hasKnownChildren ? (
                    <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'android' ? 50 : 40,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 56,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexWrap: 'nowrap',
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#9CA3AF',
    maxWidth: width / 4,
  },
  breadcrumbActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  breadcrumbChevron: {
    marginHorizontal: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  itemEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  subcategoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 21,
  },
  childCount: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  arrowContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    width: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
