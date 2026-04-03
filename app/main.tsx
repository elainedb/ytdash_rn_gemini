import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, StatusBar } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';
import VideoItem from '../components/VideoItem';
import FilterModal, { Filters } from '../components/FilterModal';
import SortModal, { SortOptions } from '../components/SortModal';

export default function MainScreen() {
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const [filters, setFilters] = useState<Filters>({ channel: null, country: null });
  const [sortOptions, setSortOptions] = useState<SortOptions>({ field: 'Published', order: 'Newest' });

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const data = await fetchAllVideos(forceRefresh);
      setAllVideos(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load videos. Check your API key or network connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = [...allVideos];

    // Filter
    if (filters.channel) {
      result = result.filter(v => v.channelName === filters.channel);
    }
    if (filters.country) {
      result = result.filter(v => v.location?.country === filters.country);
    }

    // Sort
    result.sort((a, b) => {
      let dateA = new Date(a.publishedAt).getTime();
      let dateB = new Date(b.publishedAt).getTime();

      if (sortOptions.field === 'Recorded') {
        dateA = a.recordingDate ? new Date(a.recordingDate).getTime() : dateA;
        dateB = b.recordingDate ? new Date(b.recordingDate).getTime() : dateB;
      }

      if (sortOptions.order === 'Newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setDisplayedVideos(result);
  }, [allVideos, filters, sortOptions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await GoogleSignin.signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  const channels = useMemo(() => Array.from(new Set(allVideos.map(v => v.channelName))).sort(), [allVideos]);
  const countries = useMemo(() => {
    const set = new Set<string>();
    allVideos.forEach(v => {
      if (v.location?.country) set.add(v.location.country);
    });
    return Array.from(set).sort();
  }, [allVideos]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>YouTube Videos</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.controlBtnText}>
            Filter {(filters.channel || filters.country) ? '(Active)' : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.controlBtnText}>Sort: {sortOptions.field}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.refreshBtn]} onPress={onRefresh}>
          <Text style={[styles.controlBtnText, styles.refreshBtnText]}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.mapBtn]} onPress={() => router.push('/map')}>
          <Text style={[styles.controlBtnText, styles.mapBtnText]}>View Map</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.statsLine}>Showing {displayedVideos.length} of {allVideos.length} videos</Text>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedVideos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No videos found.</Text>
              <Text style={styles.emptySubText}>Pull to refresh or check your API key.</Text>
            </View>
          }
        />
      )}

      <FilterModal 
        visible={filterModalVisible} 
        onClose={() => setFilterModalVisible(false)} 
        filters={filters} 
        onApply={setFilters} 
        channels={channels} 
        countries={countries} 
      />

      <SortModal 
        visible={sortModalVisible} 
        onClose={() => setSortModalVisible(false)} 
        sortOptions={sortOptions} 
        onApply={setSortOptions} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#d32f2f',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  refreshBtn: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  refreshBtnText: {
    color: '#fff',
  },
  mapBtn: {
    backgroundColor: '#0F9D58',
    borderColor: '#0F9D58',
  },
  mapBtnText: {
    color: '#fff',
  },
  statsLine: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
