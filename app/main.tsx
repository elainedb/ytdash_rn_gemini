import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, Alert } from 'react-native';
import { useVideosStore } from '../src/features/videos/presentation/stores/videos-store';
import { useAuthStore } from '../src/features/authentication/presentation/stores/auth-store';
import { VideoItem } from '../src/features/videos/presentation/components/VideoItem';
import { FilterModal } from '../src/features/videos/presentation/components/FilterModal';
import { SortModal } from '../src/features/videos/presentation/components/SortModal';
import { router } from 'expo-router';

export default function MainScreen() {
  const { 
    status, filteredVideos, allVideos, isRefreshing, errorMessage, 
    loadVideos, refreshVideos, filters, sortOptions 
  } = useVideosStore();
  const { signOut } = useAuthStore();

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        }
      }
    ]);
  };

  const isFilterActive = filters.channelName !== null || filters.country !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouTube Videos</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setFilterVisible(true)}>
          <Text style={styles.controlButtonText}>Filter {isFilterActive ? '(Active)' : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setSortVisible(true)}>
          <Text style={styles.controlButtonText}>Sort ({sortOptions.sortBy === 'publishedDate' ? 'Published' : 'Recorded'})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.refreshButton]} onPress={refreshVideos}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.mapButton]} onPress={() => router.push('/map')}>
          <Text style={styles.mapButtonText}>View Map</Text>
        </TouchableOpacity>
      </View>

      {isFilterActive && (
        <Text style={styles.countText}>Showing {filteredVideos.length} of {allVideos.length} videos</Text>
      )}

      {status === 'loading' && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : status === 'error' ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVideos}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredVideos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No videos found.</Text>
          <Text style={styles.emptySubText}>Pull to refresh or check filters/API key.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoItem video={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshVideos} />
          }
        />
      )}

      <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
      <SortModal visible={sortVisible} onClose={() => setSortVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  controlButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#1565c0',
    fontWeight: 'bold',
  },
  mapButton: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  mapButtonText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 8,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
  },
});
