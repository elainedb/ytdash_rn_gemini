import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet, ActivityIndicator, Linking, Button, RefreshControl } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useStore, Video } from '../../store';
import { getTestConfig } from '../../services/config';

export default function HomeScreen() {
  const { uiState, videos, error, loadVideos, filteredAndSortedVideos, setExternalLinkState, filterCategory, setFilterCategory, sortOrder, setSortOrder } = useStore();
  const navigation = useNavigation();
  const router = useRouter();

  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  
  // Set header options
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text testID="video_count" style={styles.headerTitle}>
          ytdash ({videos.length})
        </Text>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable testID="map_nav_button" onPress={() => router.push('/(main)/map')} style={styles.headerBtn}>
            <Text>Map</Text>
          </Pressable>
          <Pressable testID="logout_button" onPress={async () => {
            const { logout } = await import('../../services/auth');
            await logout();
            useStore.getState().setUser(null);
          }} style={styles.headerBtn}>
            <Text>Logout</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, videos.length]);

  useEffect(() => {
    loadVideos();
  }, []);

  const handleRefresh = () => {
    loadVideos(true);
  };

  const openVideo = async (youtubeUrl: string) => {
    const config = await getTestConfig();
    if (config.captureExternalLinks) {
      setExternalLinkState({ url: youtubeUrl });
      setTimeout(() => setExternalLinkState(null), 30000);
    } else {
      try {
        await Linking.openURL(youtubeUrl);
      } catch (err) {
        setExternalLinkState({ error: true });
        setTimeout(() => setExternalLinkState(null), 30000);
      }
    }
  };

  const renderItem = ({ item, index }: { item: Video; index: number }) => (
    <Pressable testID="video_list_item" style={styles.row} onPress={() => openVideo(item.youtubeUrl)}>
      {item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} /> : null}
      <View style={styles.rowContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.meta}>{item.category} • {new Date(item.publishedAt).toLocaleDateString()}</Text>
      </View>
    </Pressable>
  );

  if (uiState === 'loading' && videos.length === 0) {
    return <ActivityIndicator size="large" testID="loading_indicator" style={styles.center} />;
  }

  if (uiState === 'error' && videos.length === 0) {
    return (
      <View style={styles.center} testID="error_view">
        <Text>Error loading videos: {error?.message}</Text>
        <Button testID="error_retry_button" title="Retry" onPress={() => loadVideos(true)} />
      </View>
    );
  }

  if (showFilter) {
    const categories = Array.from(new Set(videos.map(v => v.category)));
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Filter by Category</Text>
        <Pressable onPress={() => setFilterCategory(null)} style={styles.option}>
          <Text>All</Text>
        </Pressable>
        {categories.map(c => (
          <Pressable key={c} onPress={() => setFilterCategory(c)} style={styles.option}>
            <Text>{c}</Text>
          </Pressable>
        ))}
        <Button testID="filter_apply_button" title="Apply Filter" onPress={() => setShowFilter(false)} />
      </View>
    );
  }

  if (showSort) {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sort Options</Text>
        <Pressable onPress={() => setSortOrder('none')} style={styles.option}><Text>Default (None)</Text></Pressable>
        <Pressable onPress={() => setSortOrder('date-desc')} style={styles.option}><Text>Date — newest</Text></Pressable>
        <Pressable onPress={() => setSortOrder('date-asc')} style={styles.option}><Text>Date — oldest</Text></Pressable>
        <Pressable onPress={() => setSortOrder('title-asc')} style={styles.option}><Text>Title — ascending</Text></Pressable>
        <Pressable onPress={() => setSortOrder('title-desc')} style={styles.option}><Text>Title — descending</Text></Pressable>
        <Button testID="sort_apply_button" title="Apply Sort" onPress={() => setShowSort(false)} />
      </View>
    );
  }

  const displayedVideos = filteredAndSortedVideos();

  return (
    <View style={styles.container} testID="screen_home">
      <View style={styles.controls}>
        <Button testID="filter_button" title="Filter" onPress={() => setShowFilter(true)} />
        <Button testID="sort_button" title="Sort" onPress={() => setShowSort(true)} />
      </View>
      <FlatList
        testID="video_list"
        data={displayedVideos}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={uiState === 'loading'} onRefresh={handleRefresh} testID="refresh_control" />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No videos found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row' },
  headerBtn: { marginHorizontal: 8 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  thumbnail: { width: 80, height: 60, marginRight: 8, backgroundColor: '#ccc' },
  rowContent: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: 'bold' },
  desc: { fontSize: 12, color: '#666', marginVertical: 2 },
  meta: { fontSize: 10, color: '#999' },
  panel: { flex: 1, padding: 16, backgroundColor: '#fff' },
  panelTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  option: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
});
