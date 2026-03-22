import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { fetchAllVideos } from '@/services/youtubeApi';
import { VideoData } from '@/services/cacheService';
import VideoItem from '@/components/VideoItem';
import FilterModal, { FilterState } from '@/components/FilterModal';
import SortModal, { SortState } from '@/components/SortModal';

export default function MainScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ channel: null, country: null });

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sort, setSort] = useState<SortState>({ field: 'published', order: 'desc' });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const data = await fetchAllVideos(forceRefresh);
      setVideos(data || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load videos. Check your API key or network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVideos(true);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await GoogleSignin.signOut();
        router.replace('/login');
      }}
    ]);
  };

  const channels = useMemo(() => {
    const set = new Set(videos.map(v => v.channelName));
    return Array.from(set).sort();
  }, [videos]);

  const countries = useMemo(() => {
    const set = new Set(videos.map(v => v.location?.country).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [videos]);

  const processedVideos = useMemo(() => {
    let result = [...videos];

    // Filter
    if (filters.channel) {
      result = result.filter(v => v.channelName === filters.channel);
    }
    if (filters.country) {
      result = result.filter(v => v.location?.country === filters.country);
    }

    // Sort
    result.sort((a, b) => {
      let dateA = a.publishedAt;
      let dateB = b.publishedAt;

      if (sort.field === 'recorded') {
        dateA = a.recordingDate || a.publishedAt;
        dateB = b.recordingDate || b.publishedAt;
      }

      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();

      if (sort.order === 'desc') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });

    return result;
  }, [videos, filters, sort]);

  const hasActiveFilters = filters.channel !== null || filters.country !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouTube Videos</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.controlText}>Filter {hasActiveFilters ? '(Active)' : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.controlText}>Sort: {sort.field === 'published' ? 'Published' : 'Recorded'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.refreshBtn]} onPress={() => loadVideos(true)}>
          <Text style={[styles.controlText, styles.whiteText]}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.mapBtn]} onPress={() => router.push('/map')}>
          <Text style={[styles.controlText, styles.whiteText]}>View Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsLine}>
        <Text style={styles.statsText}>Showing {processedVideos.length} of {videos.length} videos</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : processedVideos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No videos found.</Text>
          <Text style={styles.emptySubText}>Try to pull-to-refresh, clear filters or check your API key.</Text>
        </View>
      ) : (
        <FlatList
          data={processedVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        channels={channels}
        countries={countries}
        initialFilters={filters}
        onApply={setFilters}
      />

      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        initialSort={sort}
        onApply={setSort}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingTop: RNStatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  refreshBtn: {
    backgroundColor: '#4285F4',
  },
  mapBtn: {
    backgroundColor: '#4CAF50',
  },
  controlText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  whiteText: {
    color: '#fff',
  },
  statsLine: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
});
