import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SubCategoryModal from './SubCategoryModal';
import api from '../lib/api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface CategoryNode {
  _id: string;
  name: string;
  icon: string; // emoji string, e.g. "🚗"
  level: number;
  order: number;
  isActive: boolean;
  subcategories?: string[];
  children: CategoryNode[];
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');
const PER_ROW = 4;
const INITIAL_COUNT = 8; // show 2 rows (4 per row) initially

export default function CategoryGrid() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CategoryNode | null>(null);

  // ── Fetch tree from API ──
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: CategoryNode[] }>('/categories/tree');
      if (res?.success && Array.isArray(res.data)) {
        setTree(res.data);
      } else {
        setError('Failed to load categories');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Build display list ──
  const rootCategories = tree; // all nodes at root from /tree response
  const displayCategories = showMore
    ? rootCategories
    : rootCategories.slice(0, INITIAL_COUNT);

  // Build grid items
  const gridItems: (CategoryNode | { _id: string; name: string; isControl: 'more' | 'less' })[] =
    [...displayCategories];

  if (!showMore && rootCategories.length > INITIAL_COUNT) {
    gridItems.push({ _id: '__more__', name: 'More', isControl: 'more' });
  } else if (showMore && rootCategories.length > INITIAL_COUNT) {
    gridItems.push({ _id: '__less__', name: 'Show Less', isControl: 'less' });
  }

  // Chunk into rows
  const rows: typeof gridItems[] = [];
  for (let i = 0; i < gridItems.length; i += PER_ROW) {
    rows.push(gridItems.slice(i, i + PER_ROW));
  }

  // ── Render ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#7C3AED" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchCategories} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((item) => {
            // Control buttons (More / Show Less)
            if ('isControl' in item) {
              const isMore = item.isControl === 'more';
              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.item}
                  onPress={() => setShowMore(isMore)}
                >
                  <View style={styles.iconBox}>
                    <Ionicons
                      name={isMore ? 'add-circle' : 'remove-circle'}
                      size={28}
                      color="#6B7280"
                    />
                  </View>
                  <Text style={styles.label}>{item.name}</Text>
                </TouchableOpacity>
              );
            }

            // Regular category node
            const node = item as CategoryNode;
            return (
              <TouchableOpacity
                key={node._id}
                style={styles.item}
                onPress={() => setSelectedNode(node)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.emojiIcon}>{node.icon || '📁'}</Text>
                </View>
                <Text style={styles.label} numberOfLines={2}>{node.name}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Fill empty cells */}
          {row.length < PER_ROW &&
            Array.from({ length: PER_ROW - row.length }).map((_, i) => (
              <View key={`empty-${rowIdx}-${i}`} style={[styles.item, styles.emptyItem]} />
            ))}
        </View>
      ))}

      {/* Sub Category Modal */}
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
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
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
    color: '#374151',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
  centered: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
