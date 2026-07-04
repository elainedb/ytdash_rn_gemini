import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { fetchVideos } from '../api';
import { openExternalLink } from '../utils/link';

export default function HomeScreen() {
  const router = useRouter();
  const config = useAppStore((state) => state.config);
  const userEmail = useAppStore((state) => state.userEmail);
  const logout = useAppStore((state) => state.logout);
  const { videos, setVideos, loadCachedVideos, loading, setLoading, error, setError, filterCategory, setFilterCategory, sortOption, setSortOption } = useAppStore();
  
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  const [tempFilter, setTempFilter] = useState<string | null>(null);
  const [tempSort, setTempSort] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) {
      router.replace('/');
    } else if (videos.length === 0) {
      loadData();
    }
  }, [userEmail]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (config?.apiBaseUrl) {
        const data = await fetchVideos(config.apiBaseUrl, config.apiKey || 'mock-key');
        await setVideos(data);
      } else {
        setError('Missing apiBaseUrl');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch videos');
      await loadCachedVideos();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];
    if (filterCategory) {
      result = result.filter(v => v.category.toLowerCase() === filterCategory.toLowerCase());
    }
    if (sortOption === 'date-desc') {
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else if (sortOption === 'date-asc') {
      result.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }
    return result;
  }, [videos, filterCategory, sortOption]);

  const renderItem = ({ item }: { item: any }) => (
    <Pressable testID="video_list_item" style={styles.item} onPress={() => openExternalLink(`https://www.youtube.com/watch?v=${item.id}`)}>
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemCategory}>{item.category} • {new Date(item.publishedAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );

  return (
    <View testID="screen_home" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YT Dash</Text>
        <Text testID="video_count" style={styles.countText}>{videos.length} videos</Text>
        
        <View style={styles.headerActions}>
          <Pressable testID="filter_button" onPress={() => { setShowFilter(true); setShowSort(false); setTempFilter(filterCategory); }}>
            <Text style={styles.actionBtn}>Filter</Text>
          </Pressable>
          <Pressable testID="sort_button" onPress={() => { setShowSort(true); setShowFilter(false); setTempSort(sortOption); }}>
            <Text style={styles.actionBtn}>Sort</Text>
          </Pressable>
          <Pressable testID="map_nav_button" onPress={() => router.push('/map')}>
            <Text style={styles.actionBtn}>Map</Text>
          </Pressable>
          <Pressable testID="logout_button" onPress={handleLogout}>
            <Text style={styles.actionBtn}>Logout</Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <View testID="error_view" style={styles.errorView}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable testID="error_retry_button" onPress={loadData} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {showFilter ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Filter by Category</Text>
          {['tech', 'music', 'news', 'bike', 'cronicas', 'mnt', 'mct'].map(cat => (
            <Pressable key={cat} onPress={() => setTempFilter(tempFilter === cat ? null : cat)} style={[styles.option, tempFilter === cat && styles.selectedOption]}>
              <Text>{cat}</Text>
            </Pressable>
          ))}
          <Pressable testID="filter_apply_button" onPress={() => { setFilterCategory(tempFilter); setShowFilter(false); }} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Filter</Text>
          </Pressable>
        </View>
      ) : showSort ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Sort Options</Text>
          <Pressable onPress={() => setTempSort('date-desc')} style={[styles.option, tempSort === 'date-desc' && styles.selectedOption]}>
            <Text>Date newest</Text>
          </Pressable>
          <Pressable onPress={() => setTempSort('date-asc')} style={[styles.option, tempSort === 'date-asc' && styles.selectedOption]}>
            <Text>Date oldest</Text>
          </Pressable>
          <Pressable testID="sort_apply_button" onPress={() => { setSortOption(tempSort); setShowSort(false); }} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply Sort</Text>
          </Pressable>
        </View>
      ) : loading && videos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="loading_indicator" size="large" />
        </View>
      ) : (
        <FlatList
          testID="video_list"
          data={filteredAndSortedVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={loadData}
          refreshing={loading}
          refreshControl={
             // Maestro may select pull-to-refresh, but we can also provide a distinct refresh control natively
             <View />
          }
        />
      )}
      
      {!showFilter && !showSort && !loading && (
        <Pressable testID="refresh_control" onPress={loadData} style={{position: 'absolute', bottom: 60, right: 20, backgroundColor: 'blue', padding: 10, borderRadius: 20}}>
           <Text style={{color: 'white'}}>Refresh</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  countText: { fontSize: 14, color: 'gray', marginVertical: 4 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  actionBtn: { color: '#007AFF', fontWeight: 'bold' },
  errorView: { padding: 16, backgroundColor: '#ffebee', alignItems: 'center' },
  errorText: { color: '#c62828', marginBottom: 8 },
  retryBtn: { backgroundColor: '#c62828', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4 },
  retryBtnText: { color: 'white' },
  listContent: { padding: 16, paddingBottom: 100 },
  item: { flexDirection: 'row', backgroundColor: 'white', padding: 12, marginBottom: 12, borderRadius: 8, elevation: 2 },
  thumbnail: { width: 120, height: 90, borderRadius: 4, marginRight: 12 },
  itemText: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemCategory: { fontSize: 12, color: 'gray' },
  panel: { flex: 1, padding: 16, backgroundColor: 'white' },
  panelTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  option: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  selectedOption: { backgroundColor: '#e3f2fd' },
  applyBtn: { backgroundColor: '#4caf50', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  applyBtnText: { color: 'white', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
