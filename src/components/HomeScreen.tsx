import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useVideoState } from '../hooks/useVideoState';
import { VideoItem } from './VideoItem';
import { FilterPanel } from './FilterPanel';
import { SortPanel } from './SortPanel';

export const HomeScreen: React.FC = () => {
  const {
    videos,
    filteredVideos,
    loading,
    error,
    isOfflineMode,
    refreshVideos,
    logout,
    userEmail,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isSortPanelOpen,
    setIsSortPanelOpen,
    setCurrentScreen,
    filterCategory,
    sortOption
  } = useVideoState();

  const handleGoToMap = () => {
    console.log('[UI] Navigating to map screen via map_nav_button');
    setCurrentScreen('map');
  };

  const getSortLabel = () => {
    if (sortOption === 'default') return 'Default';
    if (sortOption === 'date_desc') return 'Newest';
    if (sortOption === 'date_asc') return 'Oldest';
    if (sortOption === 'title_asc') return 'Title A-Z';
    return 'Title Z-A';
  };

  // If a filter or sort panel is open, completely replace the list view
  // to avoid text selector collision during E2E automation runs
  if (isFilterPanelOpen) {
    return <FilterPanel />;
  }

  if (isSortPanelOpen) {
    return <SortPanel />;
  }

  return (
    <View testID="screen_home" style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.logoText}>
              yt<Text style={styles.logoHighlight}>dash</Text>
            </Text>
            {/* Must contain total loaded count and carry testID video_count */}
            <Text testID="video_count" style={styles.videoCount}> ({videos.length})</Text>
          </View>
          
          <Pressable testID="logout_button" style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {userEmail && (
          <Text style={styles.userEmailText} numberOfLines={1}>
            Signed in as: {userEmail}
          </Text>
        )}

        {isOfflineMode && (
          <View style={styles.offlineWarning}>
            <Text style={styles.offlineWarningText}>📡 Offline Mode — Showing Cached Videos</Text>
          </View>
        )}
      </View>

      {/* Main Controls Row */}
      <View style={styles.controlsRow}>
        <Pressable 
          testID="filter_button" 
          style={[styles.controlButton, filterCategory !== null && styles.controlActive]} 
          onPress={() => setIsFilterPanelOpen(true)}
        >
          <Text style={[styles.controlButtonText, filterCategory !== null && styles.controlActiveText]}>
            Filter: {filterCategory ? filterCategory : 'All'}
          </Text>
        </Pressable>

        <Pressable 
          testID="sort_button" 
          style={styles.controlButton} 
          onPress={() => setIsSortPanelOpen(true)}
        >
          <Text style={styles.controlButtonText}>
            Sort: {getSortLabel()}
          </Text>
        </Pressable>

        {/* Dual-purpose refresh button for robust Maestro targeting */}
        <Pressable 
          testID="refresh_control"
          style={styles.refreshButton}
          onPress={refreshVideos}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>{loading ? '...' : '🔄'}</Text>
        </Pressable>
      </View>

      {/* Content Area */}
      {loading && videos.length === 0 ? (
        <View testID="loading_indicator" style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.infoText}>Fetching video feed...</Text>
        </View>
      ) : error && videos.length === 0 ? (
        <View testID="error_view" style={styles.centerContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Failed to load videos.</Text>
          <Text style={styles.errorDetailText}>{error}</Text>
          <Pressable testID="error_retry_button" style={styles.retryButton} onPress={refreshVideos}>
            <Text style={styles.retryButtonText}>Retry Fetch</Text>
          </Pressable>
        </View>
      ) : filteredVideos.length === 0 ? (
        <ScrollView
          testID="video_list"
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshVideos}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>No matching videos found</Text>
          <Text style={styles.emptyDetailText}>Try clearing or modifying your filter categories.</Text>
        </ScrollView>
      ) : (
        <ScrollView
          testID="video_list"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshVideos}
              colors={['#6366F1']}
              tintColor="#6366F1"
            />
          }
        >
          {filteredVideos.map((video) => (
            <VideoItem key={video.id} video={video} />
          ))}
        </ScrollView>
      )}

      {/* Floating Map Navigation Button */}
      <Pressable 
        testID="map_nav_button" 
        style={styles.mapFab} 
        onPress={handleGoToMap}
      >
        <Text style={styles.mapFabIcon}>🗺️</Text>
        <Text style={styles.mapFabText}>View Map</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1E293B', // Slate 800
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoHighlight: {
    color: '#6366F1',
  },
  videoCount: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  logoutText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  userEmailText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 6,
  },
  offlineWarning: {
    backgroundColor: '#312E81', // Indigo 900
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  offlineWarningText: {
    color: '#C7D2FE',
    fontSize: 10,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    alignItems: 'center',
  },
  controlButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  controlActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
  },
  controlButtonText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  controlActiveText: {
    color: '#818CF8',
  },
  refreshButton: {
    backgroundColor: '#1E293B',
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 90, // Spacing for floating button
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorDetailText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyDetailText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  mapFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    gap: 8,
  },
  mapFabIcon: {
    fontSize: 16,
  },
  mapFabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
