import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Video } from '../types';

interface HomeScreenProps {
  videos: Video[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onNavigateToMap: () => void;
  onOpenVideo: (video: Video) => void;
}

type PanelType = 'none' | 'filter' | 'sort';

export default function HomeScreen({
  videos,
  isRefreshing,
  onRefresh,
  onLogout,
  onNavigateToMap,
  onOpenVideo,
}: HomeScreenProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'none' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('none');

  // Dynamic categories based on loaded videos, plus standard configurations
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    videos.forEach((v) => {
      if (v.category) categories.add(v.category);
    });
    // Add defaults if empty to avoid empty filter panel
    if (categories.size === 0) {
      categories.add('cronicas');
      categories.add('bike');
      categories.add('mnt');
      categories.add('mct');
    }
    return Array.from(categories);
  }, [videos]);

  // Temp states for unsaved selection inside panels (to support apply buttons)
  const [tempCategory, setTempCategory] = useState<string | null>(null);
  const [tempSortOption, setTempSortOption] = useState<'none' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('none');

  const openFilterPanel = () => {
    setTempCategory(selectedCategory);
    setActivePanel('filter');
  };

  const openSortPanel = () => {
    setTempSortOption(sortOption);
    setActivePanel('sort');
  };

  const applyFilter = () => {
    setSelectedCategory(tempCategory);
    setActivePanel('none');
  };

  const applySort = () => {
    setSortOption(tempSortOption);
    setActivePanel('none');
  };

  // Process sorting & filtering
  const processedVideos = useMemo(() => {
    let list = [...videos];

    // 1. Filter
    if (selectedCategory) {
      list = list.filter((v) => v.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 2. Sort
    if (sortOption !== 'none') {
      list.sort((a, b) => {
        if (sortOption === 'date-desc') {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        } else if (sortOption === 'date-asc') {
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        } else if (sortOption === 'title-asc') {
          return a.title.localeCompare(b.title);
        } else {
          return b.title.localeCompare(a.title);
        }
      });
    }

    return list;
  }, [videos, selectedCategory, sortOption]);

  const renderVideoItem = ({ item }: { item: Video }) => {
    const formattedDate = new Date(item.publishedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <Pressable
        onPress={() => onOpenVideo(item)}
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        testID="video_list_item"
      >
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        <View style={styles.cardDetails}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category?.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.cardMeta}>{formattedDate}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container} testID="screen_home">
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.appTitle}>Feeds</Text>
          {/* Total loaded videos count display */}
          <View style={styles.countBadge}>
            <Text style={styles.countText} testID="video_count">
              {videos.length} videos
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <Pressable onPress={openFilterPanel} style={styles.controlBtn} testID="filter_button">
            <Text style={styles.controlBtnText}>
              Filter{selectedCategory ? `: ${selectedCategory}` : ''}
            </Text>
          </Pressable>

          <Pressable onPress={openSortPanel} style={styles.controlBtn} testID="sort_button">
            <Text style={styles.controlBtnText}>Sort</Text>
          </Pressable>

          <Pressable onPress={onNavigateToMap} style={[styles.controlBtn, styles.mapBtn]} testID="map_nav_button">
            <Text style={styles.controlBtnText}>Map</Text>
          </Pressable>

          <Pressable onPress={onRefresh} style={styles.iconBtn} testID="refresh_control">
            <Text style={styles.iconBtnText}>↻</Text>
          </Pressable>

          <Pressable onPress={onLogout} style={[styles.iconBtn, styles.logoutBtn]} testID="logout_button">
            <Text style={styles.logoutBtnText}>➔</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content: REPLACES the list with the panel if active to avoid selector collisions */}
      {activePanel === 'filter' ? (
        <ScrollView contentContainerStyle={styles.panelContainer}>
          <Text style={styles.panelTitle}>Filter by Channel Category</Text>
          
          <Pressable
            onPress={() => setTempCategory(null)}
            style={[styles.panelOption, tempCategory === null && styles.panelOptionSelected]}
          >
            <Text style={[styles.panelOptionText, tempCategory === null && styles.panelOptionTextSelected]}>
              All Categories
            </Text>
          </Pressable>

          {availableCategories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setTempCategory(category)}
              style={[styles.panelOption, tempCategory === category && styles.panelOptionSelected]}
            >
              <Text style={[styles.panelOptionText, tempCategory === category && styles.panelOptionTextSelected]}>
                {category}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={applyFilter} style={styles.applyBtn} testID="filter_apply_button">
            <Text style={styles.applyBtnText}>Apply Filter</Text>
          </Pressable>
        </ScrollView>
      ) : activePanel === 'sort' ? (
        <ScrollView contentContainerStyle={styles.panelContainer}>
          <Text style={styles.panelTitle}>Sort Videos</Text>

          <Pressable
            onPress={() => setTempSortOption('none')}
            style={[styles.panelOption, tempSortOption === 'none' && styles.panelOptionSelected]}
          >
            <Text style={[styles.panelOptionText, tempSortOption === 'none' && styles.panelOptionTextSelected]}>
              Default Order (Unsorted)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTempSortOption('date-desc')}
            style={[styles.panelOption, tempSortOption === 'date-desc' && styles.panelOptionSelected]}
          >
            {/* Must end with key regex word "desc" or "newest" */}
            <Text style={[styles.panelOptionText, tempSortOption === 'date-desc' && styles.panelOptionTextSelected]}>
              Date — newest
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTempSortOption('date-asc')}
            style={[styles.panelOption, tempSortOption === 'date-asc' && styles.panelOptionSelected]}
          >
            <Text style={[styles.panelOptionText, tempSortOption === 'date-asc' && styles.panelOptionTextSelected]}>
              Date — oldest
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTempSortOption('title-asc')}
            style={[styles.panelOption, tempSortOption === 'title-asc' && styles.panelOptionSelected]}
          >
            <Text style={[styles.panelOptionText, tempSortOption === 'title-asc' && styles.panelOptionTextSelected]}>
              Title — A-Z
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTempSortOption('title-desc')}
            style={[styles.panelOption, tempSortOption === 'title-desc' && styles.panelOptionSelected]}
          >
            <Text style={[styles.panelOptionText, tempSortOption === 'title-desc' && styles.panelOptionTextSelected]}>
              Title — Z-A
            </Text>
          </Pressable>

          <Pressable onPress={applySort} style={styles.applyBtn} testID="sort_apply_button">
            <Text style={styles.applyBtnText}>Apply Sort</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <FlatList
          data={processedVideos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          testID="video_list"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#EF4444"
              testID="refresh_control"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No videos found</Text>
              <Text style={styles.emptySubtext}>Try refreshing the feed or changing the filter.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  countText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlBtn: {
    flex: 1.2,
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  mapBtn: {
    backgroundColor: '#475569',
  },
  controlBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  iconBtn: {
    width: 38,
    height: 38,
    backgroundColor: '#334155',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  iconBtnText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginRight: 0,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  thumbnail: {
    width: 70,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  panelContainer: {
    padding: 24,
    backgroundColor: '#0F172A',
    flexGrow: 1,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  panelOption: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  panelOptionSelected: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  panelOptionText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  panelOptionTextSelected: {
    color: '#EF4444',
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
});
