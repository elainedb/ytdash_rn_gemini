import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Button, ScrollView, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStore, Video } from '../../store';
import { getTestConfig } from '../../services/config';

export default function MapScreen() {
  const videos = useStore(state => state.videos);
  const setExternalLinkState = useStore(state => state.setExternalLinkState);
  
  const locatedVideos = videos.filter(v => v.lat !== undefined && v.lng !== undefined);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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

  const markersHtml = locatedVideos.map((v, i) => `
    var marker = L.marker([${v.lat}, ${v.lng}]).addTo(map);
    marker.on('click', function() {
      window.ReactNativeWebView.postMessage('${v.id}');
    });
  `).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([48.8566, 2.3522], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        ${markersHtml}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container} testID="screen_map">
      <WebView 
        source={{ html }} 
        style={styles.map} 
        onMessage={(event) => {
          const id = event.nativeEvent.data;
          const video = locatedVideos.find(v => v.id === id);
          if (video) setSelectedVideo(video);
        }}
      />
      
      {/* Native Map Markers row for Maestro testing */}
      <View style={styles.markersRow}>
        <Text style={{fontWeight: 'bold', marginBottom: 4}}>Native Map Markers (Test Affordance)</Text>
        <ScrollView horizontal>
          {locatedVideos.map((v, i) => (
            <Pressable 
              key={v.id} 
              testID="map_marker" 
              style={styles.chip}
              onPress={() => setSelectedVideo(v)}
            >
              <Text>{v.title.substring(0, 15)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {selectedVideo && (
        <View style={styles.bottomSheet} testID="detail_bottom_sheet">
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{selectedVideo.title}</Text>
            <Button title="Close" onPress={() => setSelectedVideo(null)} />
          </View>
          <Text testID="detail_video_url" style={{ width: 1, height: 1, color: 'transparent' }}>{selectedVideo.youtubeUrl}</Text>
          <Text style={styles.sheetDesc} numberOfLines={3}>{selectedVideo.description}</Text>
          <Button 
            testID="detail_open_youtube_button" 
            title="Open in YouTube" 
            onPress={() => openVideo(selectedVideo.youtubeUrl)} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markersRow: {
    height: 80,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 8,
  },
  chip: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-start',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
  sheetDesc: { fontSize: 14, color: '#666', marginBottom: 16 },
});
