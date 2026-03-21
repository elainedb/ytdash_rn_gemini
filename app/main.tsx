import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { fetchAllVideos, VideoData } from '@/services/youtubeApi';
import VideoItem from '@/components/VideoItem';
import FilterModal from '@/components/FilterModal';
import SortModal, { SortOptions } from '@/components/SortModal';

export default function MainScreen() {
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Sort state
  const [sortVisible, setSortVisible] = useState(false);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });

  const loadData = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const data = await fetchAllVideos(forceRefresh);
      setAllVideos(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load videos. Check your API key or network.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await GoogleSignin.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  // Compute derived data
  const { filteredAndSortedVideos, channels, countries } = useMemo(() => {
    // 1. Get unique channels and countries
    const uniqueChannels = Array.from(new Set(allVideos.map((v) => v.channelName))).sort();
    const uniqueCountries = Array.from(
      new Set(allVideos.map((v) => v.location?.country).filter(Boolean) as string[])
    ).sort();

    // 2. Filter
    let result = allVideos;
    if (selectedChannel) {
      result = result.filter((v) => v.channelName === selectedChannel);
    }
    if (selectedCountry) {
      result = result.filter((v) => v.location?.country === selectedCountry);
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      let dateA = a.publishedAt;
      let dateB = b.publishedAt;

      if (sortOptions.sortBy === 'recordingDate') {
        dateA = a.recordingDate || a.publishedAt;
        dateB = b.recordingDate || b.publishedAt;
      }

      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();

      if (sortOptions.sortOrder === 'desc') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });

    return { filteredAndSortedVideos: result, channels: uniqueChannels, countries: uniqueCountries };
  }, [allVideos, selectedChannel, selectedCountry, sortOptions]);

  const hasActiveFilters = selectedChannel !== null || selectedCountry !== null;
  const sortLabel = sortOptions.sortBy === 'publishedAt' ? 'Published' : 'Recorded';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouTube Videos</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFilterVisible(true)}>
          <Text style={styles.controlButtonText}>
            Filter {hasActiveFilters ? '(Active)' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => setSortVisible(true)}>
          <Text style={styles.controlButtonText}>Sort ({sortLabel})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.refreshButton]} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.mapButton]} onPress={() => router.push('/map')}>
          <Text style={styles.mapButtonText}>View Map</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.statsLine}>
        Showing {filteredAndSortedVideos.length} of {allVideos.length} videos
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No videos found.</Text>
              <Text style={styles.emptySubText}>Try pulling to refresh or check API key.</Text>
            </View>
          }
        />
      )}

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        channels={channels}
        countries={countries}
        selectedChannel={selectedChannel}
        selectedCountry={selectedCountry}
        onApply={(channel, country) => {
          setSelectedChannel(channel);
          setSelectedCountry(country);
          setFilterVisible(false);
        }}
      />

      <SortModal
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        currentSort={sortOptions}
        onApply={(sort) => {
          setSortOptions(sort);
          setSortVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexWrap: 'wrap',
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginBottom: 5,
  },
  controlButtonText: {
    color: '#333',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#4285F4',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapButton: {
    backgroundColor: '#4CAF50',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsLine: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fafafa',
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
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
  },
});
