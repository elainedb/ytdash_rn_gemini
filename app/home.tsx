import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import { useVideosStore, selectVisibleVideos } from '../src/store/videos';
import { useUIStore } from '../src/store/ui';
import { Video } from '../src/api/youtube';
import channelsData from '../config/channels.json';
import { ENV } from '../src/config/env';

export default function HomeScreen() {
  const { isAuthorized, logout } = useAuthStore();
  const { videos, isLoading, error, loadVideos, setFilter, setSort, filterCategory, sortBy } = useVideosStore();
  const { openExternalLink } = useUIStore();
  
  const [activePanel, setActivePanel] = useState<'none' | 'filter' | 'sort'>('none');
  const [tempFilter, setTempFilter] = useState<string | null>(null);
  const [tempSort, setTempSort] = useState<'date_desc' | 'date_asc' | 'title_asc' | null>(null);

  const visibleVideos = useMemo(() => {
    let result = [...videos];
    if (filterCategory) {
      result = result.filter(v => v.category === filterCategory);
    }
    if (sortBy) {
      result.sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        if (sortBy === 'date_asc') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
        return 0;
      });
    }
    return result;
  }, [videos, filterCategory, sortBy]);

  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/');
    }
  }, [isAuthorized]);

  useEffect(() => {
    loadVideos();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    loadVideos();
  };

  const handleOpenFilter = () => {
    setTempFilter(filterCategory);
    setActivePanel('filter');
  };

  const handleApplyFilter = () => {
    setFilter(tempFilter);
    setActivePanel('none');
  };

  const handleOpenSort = () => {
    setTempSort(sortBy);
    setActivePanel('sort');
  };

  const handleApplySort = () => {
    setSort(tempSort);
    setActivePanel('none');
  };

  const renderItem = ({ item }: { item: Video }) => (
    <Pressable 
      style={styles.card} 
      testID="video_list_item"
      onPress={() => {
        const testConfig = require('../modules/testconfig/src/TestconfigModule').default.get();
        console.log('TestConfig from native:', testConfig);
        console.log('ENV.CAPTURE_EXTERNAL_LINKS:', ENV.CAPTURE_EXTERNAL_LINKS);
        openExternalLink(item.youtubeUrl);
      }}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.meta}>{item.category} • {new Date(item.publishedAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );

  const categories = useMemo(() => {
    return channelsData.map(c => c.label);
  }, []);

  return (
    <View style={styles.container} testID="screen_home">
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>YT Dash</Text>
          <Text testID="video_count">Videos: {videos.length}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/map')} testID="map_nav_button" style={styles.actionBtn}>
            <Text style={styles.actionText}>Map</Text>
          </Pressable>
          <Pressable onPress={handleLogout} testID="logout_button" style={styles.actionBtn}>
            <Text style={styles.actionText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.toolbar}>
        <Pressable onPress={handleOpenFilter} testID="filter_button" style={styles.toolBtn}>
          <Text style={styles.toolText}>Filter {filterCategory ? `(${filterCategory})` : ''}</Text>
        </Pressable>
        <Pressable onPress={handleOpenSort} testID="sort_button" style={styles.toolBtn}>
          <Text style={styles.toolText}>Sort {sortBy ? '•' : ''}</Text>
        </Pressable>
        <Pressable onPress={handleRefresh} testID="refresh_control" style={styles.toolBtn}>
          <Text style={styles.toolText}>Refresh</Text>
        </Pressable>
      </View>

      {activePanel === 'filter' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Filter by Category</Text>
          <Pressable 
            style={[styles.optionRow, tempFilter === null && styles.optionSelected]}
            onPress={() => setTempFilter(null)}
          >
            <Text>All</Text>
          </Pressable>
          {categories.map(cat => (
            <Pressable 
              key={cat}
              style={[styles.optionRow, tempFilter === cat && styles.optionSelected]}
              onPress={() => setTempFilter(cat)}
            >
              <Text>{cat}</Text>
            </Pressable>
          ))}
          <Pressable onPress={handleApplyFilter} testID="filter_apply_button" style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Filter</Text>
          </Pressable>
        </View>
      )}

      {activePanel === 'sort' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Sort Videos</Text>
          <Pressable 
            style={[styles.optionRow, tempSort === 'date_desc' && styles.optionSelected]}
            onPress={() => setTempSort('date_desc')}
          >
            <Text>Date - newest</Text>
          </Pressable>
          <Pressable 
            style={[styles.optionRow, tempSort === 'date_asc' && styles.optionSelected]}
            onPress={() => setTempSort('date_asc')}
          >
            <Text>Date - oldest</Text>
          </Pressable>
          <Pressable 
            style={[styles.optionRow, tempSort === 'title_asc' && styles.optionSelected]}
            onPress={() => setTempSort('title_asc')}
          >
            <Text>Title A-Z</Text>
          </Pressable>
          <Pressable onPress={handleApplySort} testID="sort_apply_button" style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Sort</Text>
          </Pressable>
        </View>
      )}

      {activePanel === 'none' && (
        <>
          {isLoading && !videos.length ? (
            <View style={styles.center} testID="loading_indicator">
              <ActivityIndicator size="large" />
            </View>
          ) : error && !videos.length ? (
            <View style={styles.center} testID="error_view">
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={handleRefresh} testID="error_retry_button" style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              testID="video_list"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl 
                  refreshing={isLoading} 
                  onRefresh={handleRefresh} 
                />
              }
            >
              {visibleVideos.map((item) => (
                <View key={item.id}>
                  {renderItem({ item })}
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  actionText: {
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  toolBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
  },
  toolText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  thumbnail: {
    width: '100%',
    height: 10,
  },
  cardContent: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    color: '#888',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4285F4',
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
  },
  applyBtn: {
    marginTop: 24,
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
