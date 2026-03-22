import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';
import VideoItem from '../components/VideoItem';
import FilterModal from '../components/FilterModal';
import SortModal, { SortField, SortOrder } from '../components/SortModal';

export default function MainScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>('Published');
  const [sortOrder, setSortOrder] = useState<SortOrder>('Newest');

  useEffect(() => {
    loadVideos(false);
  }, []);

  const loadVideos = async (forceRefresh: boolean) => {
    try {
      if (!forceRefresh) setLoading(true);
      setError(null);
      const data = await fetchAllVideos(forceRefresh);
      setVideos(data);
    } catch (e) {
      setError('Failed to load videos.');
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
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          try {
            await GoogleSignin.signOut();
            router.replace('/login');
          } catch (e) {
            console.error(e);
          }
        }
      }
    ]);
  };

  const channels = useMemo(() => {
    const uniqueChannels = new Set(videos.map(v => v.channelName));
    return Array.from(uniqueChannels).sort();
  }, [videos]);

  const countries = useMemo(() => {
    const uniqueCountries = new Set(videos.map(v => v.location?.country).filter(Boolean) as string[]);
    return Array.from(uniqueCountries).sort();
  }, [videos]);

  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];

    if (selectedChannel) {
      result = result.filter(v => v.channelName === selectedChannel);
    }
    if (selectedCountry) {
      result = result.filter(v => v.location?.country === selectedCountry);
    }

    result.sort((a, b) => {
      let dateA = a.publishedAt;
      let dateB = b.publishedAt;

      if (sortField === 'Recorded') {
        dateA = a.recordingDate || a.publishedAt;
        dateB = b.recordingDate || b.publishedAt;
      }

      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();

      if (sortOrder === 'Newest') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });

    return result;
  }, [videos, selectedChannel, selectedCountry, sortField, sortOrder]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouTube Videos</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.controlText}>Filter {(selectedChannel || selectedCountry) ? '(Active)' : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.controlText}>Sort: {sortField}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.refreshBtn]} onPress={() => loadVideos(true)}>
          <Text style={styles.controlTextWhite}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.mapBtn]} onPress={() => router.push('/map')}>
          <Text style={styles.controlTextWhite}>View Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Showing {filteredAndSortedVideos.length} of {videos.length} videos</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadVideos(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredAndSortedVideos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No videos found.</Text>
          <Text style={styles.emptySubtext}>Pull to refresh or check API key.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedVideos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        channels={channels}
        countries={countries}
        selectedChannel={selectedChannel}
        selectedCountry={selectedCountry}
        onApply={(channel, country) => {
          setSelectedChannel(channel);
          setSelectedCountry(country);
        }}
      />

      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        field={sortField}
        order={sortOrder}
        onApply={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
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
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
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
  controlsBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexWrap: 'wrap',
  },
  controlBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  refreshBtn: {
    backgroundColor: '#4285F4',
  },
  mapBtn: {
    backgroundColor: '#0F9D58',
  },
  controlText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlTextWhite: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
