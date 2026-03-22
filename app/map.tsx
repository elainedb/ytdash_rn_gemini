import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { fetchAllVideos } from '@/services/youtubeApi';
import { VideoData } from '@/services/cacheService';
import { Image } from 'expo-image';

export default function MapScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    loadMapVideos();
  }, []);

  const loadMapVideos = async () => {
    try {
      const data = await fetchAllVideos(false); // No force refresh
      const withLocation = data.filter(v => v.location?.latitude && v.location?.longitude);
      setVideos(withLocation);
    } catch (e) {
      console.log('Error loading videos for map');
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const video = videos.find(v => v.id === data.videoId);
        if (video) {
          setSelectedVideo(video);
          bottomSheetRef.current?.expand();
        }
      }
    } catch (e) {
      console.log('Invalid message from webview');
    }
  };

  const mapHtml = useMemo(() => {
    const markersCode = videos.map(v => {
      const lat = v.location?.latitude;
      const lon = v.location?.longitude;
      if (!lat || !lon) return '';
      return `
        L.marker([${lat}, ${lon}], {
          icon: L.divIcon({
            className: 'custom-icon',
            html: '<div style="background-color: #4285F4; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📷</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(featureGroup).on('click', function() {
          const msg = JSON.stringify({ type: 'markerClick', videoId: '${v.id}' });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(msg);
          }
        });
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          #map { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([37.7749, -122.4194], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const featureGroup = L.featureGroup().addTo(map);

          setTimeout(() => {
            ${markersCode}
            if (Object.keys(featureGroup._layers).length > 0) {
              map.fitBounds(featureGroup.getBounds().pad(0.1));
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;
  }, [videos]);

  const handleWatchOnYouTube = async () => {
    if (!selectedVideo) return;

    const youtubeAppUrlIos = `youtube://watch?v=${selectedVideo.id}`;
    const youtubeAppUrlAndroid = `vnd.youtube:${selectedVideo.id}`;
    const fallbackUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`;

    try {
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL(youtubeAppUrlIos);
        if (canOpen) {
          await Linking.openURL(youtubeAppUrlIos);
        } else {
          await Linking.openURL(fallbackUrl);
        }
      } else {
        const canOpen = await Linking.canOpenURL(youtubeAppUrlAndroid);
        if (canOpen) {
          await Linking.openURL(youtubeAppUrlAndroid);
        } else {
          await Linking.openURL(fallbackUrl);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open YouTube link.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Video Locations</Text>
        <View style={{ width: 60 }} />
      </View>

      {videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No videos with location data found.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadMapVideos}>
            <Text style={{ color: '#fff' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['25%']}
        enablePanDownToClose
      >
        {selectedVideo ? (
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.row}>
              <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.thumbnail} />
              <View style={styles.info}>
                <Text style={styles.videoTitle} numberOfLines={2}>{selectedVideo.title}</Text>
                <Text style={styles.channelName} numberOfLines={1}>{selectedVideo.channelName}</Text>
                <Text style={styles.dateText}>Published: {selectedVideo.publishedAt}</Text>
                {selectedVideo.recordingDate && <Text style={styles.dateText}>Recorded: {selectedVideo.recordingDate}</Text>}
              </View>
            </View>

            <View style={styles.locationRow}>
              <Text style={styles.locationText}>
                📍 {selectedVideo.location?.city ? `${selectedVideo.location.city}, ` : ''}{selectedVideo.location?.country || ''} 
                ({selectedVideo.location?.latitude?.toFixed(6)}, {selectedVideo.location?.longitude?.toFixed(6)})
              </Text>
            </View>
            
            {selectedVideo.tags && selectedVideo.tags.length > 0 && (
              <Text style={styles.tagsText} numberOfLines={1}>
                {selectedVideo.tags.slice(0, 5).join(', ')}
              </Text>
            )}

            <TouchableOpacity style={styles.watchBtn} onPress={handleWatchOnYouTube}>
              <Text style={styles.watchBtnText}>Watch on YouTube</Text>
            </TouchableOpacity>
          </BottomSheetView>
        ) : (
          <BottomSheetView style={styles.sheetContent}>
            <View />
          </BottomSheetView>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  backBtn: { width: 60 },
  backText: { color: '#4285F4', fontSize: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  map: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { marginTop: 16, backgroundColor: '#4285F4', padding: 12, borderRadius: 8 },
  sheetContent: { flex: 1, padding: 16 },
  row: { flexDirection: 'row' },
  thumbnail: { width: 80, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'flex-start' },
  videoTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  channelName: { fontSize: 12, color: '#666', marginBottom: 2 },
  dateText: { fontSize: 11, color: '#888' },
  locationRow: { marginTop: 12 },
  locationText: { fontSize: 12, color: '#333' },
  tagsText: { fontSize: 11, fontStyle: 'italic', color: '#999', marginTop: 4 },
  watchBtn: {
    marginTop: 16,
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  watchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
