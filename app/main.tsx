import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';
import VideoItem from '../components/VideoItem';
import FilterModal from '../components/FilterModal';
import SortModal, { SortField, SortOrder } from '../components/SortModal';

const MainScreen = () => {
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [sortField, setSortField] = useState<SortField>('publishedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const router = useRouter();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async (force = false) => {
    if (!force) setLoading(true);
    try {
      const videos = await fetchAllVideos(force);
      setAllVideos(videos);
    } catch (error) {
      console.error(error);
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
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await GoogleSignin.signOut();
            router.replace('/login');
          } catch (error) {
            console.error(error);
          }
        },
      },
    ]);
  };

  const channels = useMemo(() => {
    const uniqueChannels = Array.from(new Set(allVideos.map((v) => v.channelName)));
    return uniqueChannels.sort();
  }, [allVideos]);

  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(allVideos.map((v) => v.location?.country).filter(Boolean))
    ) as string[];
    return uniqueCountries.sort();
  }, [allVideos]);

  useEffect(() => {
    let result = [...allVideos];

    // Apply filters
    if (selectedChannel !== 'All') {
      result = result.filter((v) => v.channelName === selectedChannel);
    }
    if (selectedCountry !== 'All') {
      result = result.filter((v) => v.location?.country === selectedCountry);
    }

    // Apply sorting
    result.sort((a, b) => {
      const valA = (sortField === 'recordingDate' ? a.recordingDate : a.publishedAt) || a.publishedAt;
      const valB = (sortField === 'recordingDate' ? b.recordingDate : b.publishedAt) || b.publishedAt;

      if (sortOrder === 'desc') {
        return valB.localeCompare(valA);
      } else {
        return valA.localeCompare(valB);
      }
    });

    setFilteredVideos(result);
  }, [allVideos, selectedChannel, selectedCountry, sortField, sortOrder]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouTube Videos</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={[styles.controlButton, (selectedChannel !== 'All' || selectedCountry !== 'All') && styles.activeControl]}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={styles.controlButtonText}>
            Filter {(selectedChannel !== 'All' || selectedCountry !== 'All') ? '(Active)' : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => setSortVisible(true)}>
          <Text style={styles.controlButtonText}>
            Sort: {sortField === 'publishedAt' ? 'Published' : 'Recorded'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.refreshButton]} onPress={() => loadVideos(true)}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.mapButton]} onPress={() => router.push('/map')}>
          <Text style={styles.mapButtonText}>View Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Showing {filteredVideos.length} of {allVideos.length} videos
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No videos found.</Text>
              <Text style={styles.emptySubText}>Try clearing filters or checking your API key.</Text>
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
        }}
      />

      <SortModal
        visible={sortVisible}
        onClose={() => setSortVisible(false)}
        selectedField={sortField}
        selectedOrder={sortOrder}
        onApply={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  controlsBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeControl: {
    backgroundColor: '#e8f0fe',
    borderColor: '#4285F4',
  },
  controlButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  refreshButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  mapButton: {
    backgroundColor: '#34a853',
    borderColor: '#34a853',
  },
  mapButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MainScreen;
