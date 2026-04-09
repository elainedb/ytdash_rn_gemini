import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { container } from '../src/core/di/container';
import { useVideosStore } from '../src/features/videos/presentation/stores/videos-store';
import { useAuthStore } from '../src/features/authentication/presentation/stores/auth-store';
import { VideoItem } from '../src/features/videos/presentation/components/VideoItem';
import { FilterModal } from '../src/features/videos/presentation/components/FilterModal';
import { SortModal } from '../src/features/videos/presentation/components/SortModal';

export default function MainScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { 
    status, 
    allVideos,
    filteredVideos, 
    filters, 
    sortOptions, 
    isRefreshing, 
    errorMessage, 
    loadVideos, 
    refreshVideos,
    filterByChannel,
    filterByCountry,
    sortVideos,
  } = useVideosStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const availableChannels = Array.from(new Set(allVideos.map(v => v.channelName).filter(Boolean))).sort();
  const availableCountries = Array.from(new Set(allVideos.map(v => v.country).filter((c): c is string => c !== null))).sort();

  useEffect(() => {
    loadVideos(container.getVideos);
  }, [loadVideos]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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

  const hasActiveFilters = filters.channelName !== null || filters.country !== null;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>YouTube Videos</Text>
      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderControls = () => (
    <View style={styles.controlsBar}>
      <TouchableOpacity style={styles.controlButton} onPress={() => setFilterModalVisible(true)}>
        <Text style={styles.controlButtonText}>Filter {hasActiveFilters ? '(Active)' : ''}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton} onPress={() => setSortModalVisible(true)}>
        <Text style={styles.controlButtonText}>
          Sort ({sortOptions.sortBy === 'publishedDate' ? 'Published' : 'Recorded'})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.controlButton, styles.refreshButton]} onPress={() => refreshVideos(container.getVideos)}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.controlButton, styles.mapButton]} onPress={() => router.push('/map')}>
        <Text style={styles.mapButtonText}>View Map</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (status === 'loading' && !isRefreshing && filteredVideos.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      );
    }

    if (status === 'error' && filteredVideos.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMessage || 'Failed to load videos.'}</Text>
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
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => refreshVideos(container.getVideos)} colors={['#4285F4']} />
        }
        ListHeaderComponent={() => (
          <Text style={styles.countText}>
            Showing {filteredVideos.length} videos
          </Text>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos found.</Text>
            <Text style={styles.emptySubText}>Pull to refresh or check your API key / filters.</Text>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      {renderControls()}
      {renderContent()}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        availableChannels={availableChannels}
        availableCountries={availableCountries}
        currentChannel={filters.channelName}
        currentCountry={filters.country}
        onApplyFilters={(channel, country) => {
          filterByChannel(channel);
          filterByCountry(country);
        }}
      />

      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        currentSortOptions={sortOptions}
        onApplySort={({ sortBy, sortOrder }) => sortVideos(sortBy, sortOrder)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    color: '#333',
  },
  logoutButtonText: {
    color: '#d32f2f',
    fontWeight: '600',
    fontSize: 16,
  },
  controlsBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#e8f0fe',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1a73e8',
  },
  mapButton: {
    backgroundColor: '#e6f4ea',
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#137333',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  countText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
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
