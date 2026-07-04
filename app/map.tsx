import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useAppStore } from '../store';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { openExternalLink } from '../utils/link';
import { Video } from '../api';

export default function MapScreen() {
  const router = useRouter();
  const videos = useAppStore(state => state.videos);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const locatedVideos = useMemo(() => videos.filter(v => v.location), [videos]);

  const mapHtml = useMemo(() => {
    const markersJson = JSON.stringify(locatedVideos.map(v => ({
      id: v.id,
      title: v.title,
      lat: v.location!.lat,
      lng: v.location!.lng
    })));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([0, 0], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OSM Contributors'
          }).addTo(map);

          const markers = ${markersJson};
          const bounds = [];

          markers.forEach(m => {
            const marker = L.marker([m.lat, m.lng]).addTo(map);
            marker.bindPopup(m.title);
            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_tap', id: m.id }));
            });
            bounds.push([m.lat, m.lng]);
          });

          if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        </script>
      </body>
      </html>
    `;
  }, [locatedVideos]);

  return (
    <View testID="screen_map" style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Map View</Text>
      </View>

      <WebView
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'marker_tap') {
              const video = locatedVideos.find(v => v.id === data.id);
              if (video) setSelectedVideo(video);
            }
          } catch (e) {}
        }}
      />

      <View style={styles.affordanceContainer}>
        <Text style={styles.affordanceTitle}>Native Markers (Maestro Fallback)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.affordanceScroll}>
          {locatedVideos.map(v => (
            <Pressable key={v.id} testID="map_marker" style={styles.chip} onPress={() => setSelectedVideo(v)}>
              <Text numberOfLines={1} style={styles.chipText}>{v.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {selectedVideo && (
        <View testID="detail_bottom_sheet" style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{selectedVideo.title}</Text>
            <Pressable onPress={() => setSelectedVideo(null)}>
              <Text style={styles.closeBtn}>Close</Text>
            </Pressable>
          </View>
          
          <Text testID="detail_video_url" style={styles.sheetUrl}>
            https://www.youtube.com/watch?v={selectedVideo.id}
          </Text>

          <Pressable 
            testID="detail_open_youtube_button" 
            style={styles.openBtn}
            onPress={() => openExternalLink(`https://www.youtube.com/watch?v=${selectedVideo.id}`)}
          >
            <Text style={styles.openBtnText}>Open in YouTube</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  backBtn: { marginRight: 16, padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  map: { flex: 1 },
  affordanceContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8 },
  affordanceTitle: { fontSize: 12, color: 'gray', paddingHorizontal: 16, marginBottom: 8 },
  affordanceScroll: { paddingHorizontal: 12 },
  chip: { backgroundColor: '#e0e0e0', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 4, maxWidth: 150 },
  chipText: { fontSize: 12 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 32, // Safe area roughly
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 }
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 16 },
  closeBtn: { color: 'gray', fontWeight: 'bold' },
  sheetUrl: { fontSize: 14, color: '#666', marginBottom: 16 },
  openBtn: { backgroundColor: '#FF0000', padding: 16, borderRadius: 8, alignItems: 'center' },
  openBtnText: { color: 'white', fontWeight: 'bold' }
});
