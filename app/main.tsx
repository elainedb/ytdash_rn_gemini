import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SafeAreaView, StatusBar, View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';
import { VideoItem } from '../components/VideoItem';
import { FilterModal } from '../components/FilterModal';
import { SortModal, SortField, SortOrder } from '../components/SortModal';

export default function MainScreen() {
  const [allVideos, setAllVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Filter state
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('published');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await fetchAllVideos(forceRefresh, (updatedVideos) => {
        setAllVideos(updatedVideos);
      });
      setAllVideos(data);
    } catch (e: any) {
      setError('Failed to load videos. Check your API key and connection.');
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          } catch (error) {
            console.error(error);
          }
        } 
      }
    ]);
  };

  // Derived filter options
  const channels = useMemo(() => Array.from(new Set(allVideos.map(v => v.channelName))).sort(), [allVideos]);
  const countries = useMemo(() => Array.from(new Set(allVideos.map(v => v.location?.country).filter((c): c is string => !!c))).sort(), [allVideos]);

  // Apply filters and sorting
  const processedVideos = useMemo(() => {
    let result = [...allVideos];

    // Filter
    if (selectedChannel) {
      result = result.filter(v => v.channelName === selectedChannel);
    }
    if (selectedCountry) {
      result = result.filter(v => v.location?.country === selectedCountry);
    }

    // Sort
    result.sort((a, b) => {
      let dateA = a.publishedAt;
      let dateB = b.publishedAt;

      if (sortField === 'recorded') {
        dateA = a.recordingDate || a.publishedAt;
        dateB = b.recordingDate || b.publishedAt;
      }

      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();

      if (sortOrder === 'desc') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });

    return result;
  }, [allVideos, selectedChannel, selectedCountry, sortField, sortOrder]);

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>YouTube Videos</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.controlText}>
            Filter {(selectedChannel || selectedCountry) ? '(Active)' : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.controlText}>
            Sort ({sortField === 'published' ? 'Published' : 'Recorded'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.refreshButton]} onPress={() => loadData(true)}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlButton, styles.mapButton]} onPress={() => router.push('/map')}>
          <Text style={styles.mapText}>View Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          Showing {processedVideos.length} of {allVideos.length} videos
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData(true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={processedVideos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={['#4285F4']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No videos found.</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or check your API key / filters.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        channels={channels}
        countries={countries}
        initialChannel={selectedChannel}
        initialCountry={selectedCountry}
        onApply={(channel, country) => {
          setSelectedChannel(channel);
          setSelectedCountry(country);
          setFilterModalVisible(false);
        }}
      />

      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        initialField={sortField}
        initialOrder={sortOrder}
        onApply={(field, order) => {
          setSortField(field);
          setSortOrder(order);
          setSortModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  logoutText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
    flexWrap: 'wrap',
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  controlText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#e8f0fe',
  },
  refreshText: {
    color: '#4285F4',
    fontWeight: '600',
    fontSize: 12,
  },
  mapButton: {
    backgroundColor: '#e8f5e9',
  },
  mapText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 12,
  },
  statsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsText: {
    color: '#666',
    fontSize: 12,
  },
  centerContainer: {
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
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
