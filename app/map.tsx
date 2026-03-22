import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';
import { Image } from 'expo-image';

export default function MapScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllVideos(false);
      const geoVideos = data.filter(v => v.location?.latitude && v.location?.longitude);
      setVideos(geoVideos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
        .custom-marker {
          background-color: #4285F4;
          border: 2px solid white;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([37.7749, -122.4194], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const markersGroup = L.featureGroup().addTo(map);

        function addMarkers(videos) {
          videos.forEach(v => {
            const icon = L.divIcon({
              className: 'custom-marker',
              html: '📷',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            
            const marker = L.marker([v.location.latitude, v.location.longitude], { icon })
              .addTo(markersGroup);
            
            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                videoId: v.id
              }));
            });
          });

          if (videos.length > 0) {
            map.fitBounds(markersGroup.getBounds().pad(0.1));
          }
        }

        window.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'setMarkers') {
              addMarkers(data.videos);
            }
          } catch(e) {}
        });
        
        document.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'setMarkers') {
              addMarkers(data.videos);
            }
          } catch(e) {}
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const vid = videos.find(v => v.id === data.videoId);
        if (vid) {
          setSelectedVideo(vid);
          bottomSheetRef.current?.expand();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWebViewLoad = () => {
    setTimeout(() => {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'setMarkers',
        videos
      }));
    }, 1000);
  };

  const handleWatchOnYouTube = async () => {
    if (!selectedVideo) return;
    const v = selectedVideo;
    
    const youtubeUrl = Platform.OS === 'ios' ? `youtube://${v.id}` : `vnd.youtube:${v.id}`;
    const webUrl = `https://www.youtube.com/watch?v=${v.id}`;

    try {
      const canOpen = await Linking.canOpenURL(youtubeUrl);
      if (canOpen) {
        await Linking.openURL(youtubeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (e) {
      try {
        await Linking.openURL(webUrl);
      } catch (err) {
        Alert.alert('Error', 'Could not open video.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading map data...</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No videos with location data found.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadMapData}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{'<'} Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Text style={styles.headerBackText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Locations</Text>
        <View style={{ width: 60 }} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoadEnd={handleWebViewLoad}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['25%', '50%']}
        index={-1}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedVideo && (
            <View style={styles.sheetInner}>
              <View style={styles.sheetRow}>
                <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.sheetThumbnail} />
                <View style={styles.sheetInfo}>
                  <Text style={styles.sheetTitle} numberOfLines={2}>{selectedVideo.title}</Text>
                  <Text style={styles.sheetChannel} numberOfLines={1}>{selectedVideo.channelName}</Text>
                </View>
              </View>
              
              <Text style={styles.sheetMeta}>Published: {selectedVideo.publishedAt}</Text>
              {selectedVideo.recordingDate && <Text style={styles.sheetMeta}>Recorded: {selectedVideo.recordingDate}</Text>}
              
              <Text style={styles.sheetMeta}>
                📍 {selectedVideo.location?.city ? `${selectedVideo.location.city}, ` : ''}{selectedVideo.location?.country || ''} 
                ({selectedVideo.location?.latitude?.toFixed(6)}, {selectedVideo.location?.longitude?.toFixed(6)})
              </Text>
              
              {selectedVideo.tags.length > 0 && (
                <Text style={styles.sheetTags} numberOfLines={1}>
                  {selectedVideo.tags.slice(0, 5).join(', ')}
                </Text>
              )}

              <TouchableOpacity style={styles.watchBtn} onPress={handleWatchOnYouTube}>
                <Text style={styles.watchBtnText}>Watch on YouTube</Text>
              </TouchableOpacity>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  headerBackBtn: {
    paddingVertical: 8,
    paddingRight: 8,
    width: 60,
  },
  headerBackText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  webview: {
    flex: 1,
  },
  sheetContent: {
    padding: 16,
  },
  sheetInner: {
    width: '100%',
  },
  sheetRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sheetThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  sheetInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  sheetChannel: {
    fontSize: 12,
    color: '#666',
  },
  sheetMeta: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  sheetTags: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  watchBtn: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  watchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
});
