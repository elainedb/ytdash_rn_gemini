import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useVideosStore } from '@/src/features/videos/presentation/stores/videos-store';
import { useAuthStore } from '@/src/features/authentication/presentation/stores/auth-store';
import { VideoItem } from '@/src/features/videos/presentation/components/VideoItem';
import { FilterModal } from '@/src/features/videos/presentation/components/FilterModal';
import { SortModal } from '@/src/features/videos/presentation/components/SortModal';
import { ThemedView } from '@/components/themed-view';
import { container } from '@/src/core/di/container';

export default function MainScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const {
    status,
    allVideos,
    filteredVideos,
    filters,
    sortOptions,
    errorMessage,
    isRefreshing,
    loadVideos,
    refreshVideos,
  } = useVideosStore();

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  useEffect(() => {
    if (status === 'initial') {
      loadVideos(container.getVideos);
    }
  }, [status, loadVideos]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const isFilterActive = filters.channelName !== null || filters.country !== null;
  const sortLabel = sortOptions.sortBy === 'publishedDate' ? 'Published' : 'Recorded';

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>YouTube Videos</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsBar}>
      <TouchableOpacity style={styles.controlButton} onPress={() => setFilterVisible(true)}>
        <Text style={styles.controlButtonText}>
          Filter {isFilterActive ? '(Active)' : ''}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton} onPress={() => setSortVisible(true)}>
        <Text style={styles.controlButtonText}>Sort ({sortLabel})</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.controlButton, styles.refreshButton]} onPress={() => refreshVideos(container.getVideos)}>
        <Text style={[styles.controlButtonText, styles.whiteText]}>Refresh</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.controlButton, styles.mapButton]} onPress={() => router.push('/map')}>
        <Text style={[styles.controlButtonText, styles.whiteText]}>View Map</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (status === 'loading' && allVideos.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      );
    }

    if (status === 'error' && allVideos.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMessage || 'Failed to load videos'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadVideos(container.getVideos)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoItem video={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => refreshVideos(container.getVideos)} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No videos found.</Text>
            <Text style={styles.emptySubText}>Try pulling to refresh or adjust your filters.</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ThemedView style={styles.container}>
        {renderHeader()}
        {renderControls()}
        
        {isFilterActive && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              Showing {filteredVideos.length} of {allVideos.length} videos
            </Text>
          </View>
        )}

        {renderContent()}

        <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} />
        <SortModal visible={sortVisible} onClose={() => setSortVisible(false)} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#d32f2f',
    borderRadius: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#4285F4',
  },
  mapButton: {
    backgroundColor: '#34A853',
  },
  controlButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  whiteText: {
    color: '#fff',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  countText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});
