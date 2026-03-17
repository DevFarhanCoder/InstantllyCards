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
import { getCategoryChildren } from '../lib/categoryService';
import type { CategoryNode } from '../types/category';

const { width } = Dimensions.get('window');
const FALLBACK_ICON = '\uD83D\uDCC1';
const GRID_COLUMNS = 4;

const getSingleIcon = (icon?: string) => {
  const trimmedIcon = icon?.trim();
  if (!trimmedIcon) {
    return FALLBACK_ICON;
  }

  const [firstToken] = trimmedIcon.split(/\s+/);
  return Array.from(firstToken || '')[0] || FALLBACK_ICON;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  node: CategoryNode | null;
}

interface Crumb {
  node: CategoryNode;
  children: CategoryNode[];
}

export default function SubCategoryModal({ visible, onClose, node }: Props) {
  const [search, setSearch] = useState('');
  const [stack, setStack] = useState<Crumb[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !node) {
      setStack([]);
      setSearch('');
      return;
    }

    setStack([{ node, children: node.children ?? [] }]);
    setSearch('');
  }, [visible, node]);

  const current = stack[stack.length - 1] ?? null;

  const fetchChildren = useCallback(async (targetNode: CategoryNode): Promise<CategoryNode[]> => {
    if (targetNode.children && targetNode.children.length > 0) {
      return targetNode.children;
    }

    setLoadingId(targetNode._id);
    try {
      return await getCategoryChildren(targetNode._id);
    } catch {
      return [];
    } finally {
      setLoadingId(null);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadInitialChildren = async () => {
      if (!visible || !node) {
        return;
      }

      if ((node.children || []).length > 0) {
        return;
      }

      const children = await fetchChildren(node);
      if (isCancelled) {
        return;
      }

      setStack([{ node: { ...node, children }, children }]);
    };

    loadInitialChildren();

    return () => {
      isCancelled = true;
    };
  }, [visible, node, fetchChildren]);

  const handleChildPress = async (child: CategoryNode) => {
    const children = await fetchChildren(child);

    if (children.length > 0) {
      setStack((prev) => [...prev, { node: child, children }]);
      setSearch('');
      return;
    }

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
  };

  const handleBack = () => {
    if (stack.length <= 1) {
      handleClose();
      return;
    }

    setStack((prev) => prev.slice(0, -1));
    setSearch('');
  };

  const handleClose = () => {
    setStack([]);
    setSearch('');
    onClose();
  };

  const allItems = current?.children ?? [];
  const filtered = search.trim()
    ? allItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;
  const remainder = filtered.length % GRID_COLUMNS;
  const gridData =
    remainder === 0
      ? filtered
      : [
          ...filtered,
          ...Array.from({ length: GRID_COLUMNS - remainder }, () => null),
        ];
  const title = current?.node.name ?? '';

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
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
          </View>

          {stack.length > 1 && (
            <View style={styles.breadcrumbRow}>
              {stack.map((crumb, idx) => (
                <React.Fragment key={crumb.node._id}>
                  {idx > 0 && (
                    <Ionicons
                      name="chevron-forward"
                      size={12}
                      color="#9CA3AF"
                      style={styles.breadcrumbChevron}
                    />
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

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={18}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
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
              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {search.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </Text>
          </View>
        )}

        <FlatList
          data={gridData}
          keyExtractor={(item, index) => item?._id ?? `placeholder-${index}`}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.gridRow}
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
            if (!item) {
              return <View style={[styles.subcategoryItem, styles.placeholderItem]} />;
            }

            const hasKnownChildren =
              item.children && item.children.length > 0;
            const isLoading = loadingId === item._id;

            return (
              <TouchableOpacity
                style={styles.subcategoryItem}
                onPress={() => handleChildPress(item)}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : (
                  <Text style={styles.itemEmoji}>{getSingleIcon(item.icon)}</Text>
                )}
                <Text style={styles.subcategoryText} numberOfLines={2}>
                  {item.name}
                </Text>
                {hasKnownChildren ? (
                  <Text style={styles.childCount}>
                    {item.children.length} more
                  </Text>
                ) : null}
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
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
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
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.2,
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
    color: '#333333',
    letterSpacing: 0.2,
    maxWidth: width / 4,
  },
  breadcrumbActive: {
    color: '#1A1A1A',
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
  searchIcon: {
    marginRight: 8,
  },
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
    color: '#333333',
    letterSpacing: 0.2,
  },
  listContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  gridRow: {
    columnGap: 10,
    marginBottom: 10,
  },
  subcategoryItem: {
    flex: 1,
    minHeight: 96,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 0,
  },
  placeholderItem: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  itemEmoji: {
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 8,
  },
  subcategoryText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#333333',
    lineHeight: 14,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  childCount: {
    fontSize: 10,
    color: '#333333',
    letterSpacing: 0.2,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#333333',
    letterSpacing: 0.2,
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#333333',
    letterSpacing: 0.2,
    marginTop: 4,
  },
});
