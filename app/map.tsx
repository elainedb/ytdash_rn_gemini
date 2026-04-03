import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';

const MapScreen = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const router = useRouter();

  const snapPoints = useMemo(() => ['25%'], []);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const allVideos = await fetchAllVideos();
      const geolocatedVideos = allVideos.filter(
        (v) => v.location?.latitude !== undefined && v.location?.longitude !== undefined
      );
      setVideos(geolocatedVideos);
    } catch (error) {
      console.error(error);
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
        #map { height: 100vh; width: 100vw; }
        .custom-marker {
          background-color: #4285F4;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justifyContent: center;
          color: white;
          font-size: 16px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([37.7749, -122.4194], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const markers = L.featureGroup().addTo(map);

        window.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'setMarkers') {
            markers.clearLayers();
            data.videos.forEach((video) => {
              const marker = L.marker([video.location.latitude, video.location.longitude], {
                icon: L.divIcon({
                  className: 'custom-marker',
                  html: '📷',
                  iconSize: [30, 30],
                  iconAnchor: [15, 15]
                })
              }).addTo(markers);
              
              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'markerClick',
                  videoId: video.id
                }));
              });
            });

            if (data.videos.length > 0) {
              map.fitBounds(markers.getBounds().pad(0.1));
            }
          }
        });

        document.addEventListener('message', (event) => {
          // For Android compatibility if needed
          window.dispatchEvent(new MessageEvent('message', { data: event.data }));
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (!loading && videos.length > 0) {
      const timer = setTimeout(() => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: 'setMarkers',
            videos: videos,
          })
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, videos]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const video = videos.find((v) => v.id === data.videoId);
        if (video) {
          setSelectedVideo(video);
          bottomSheetRef.current?.expand();
        }
      }
    } catch {
      console.error('Error parsing WebView message');
    }
  };

  const openInYouTube = async () => {
    if (!selectedVideo) return;

    const youtubeAppUrl = Platform.OS === 'android' ? `vnd.youtube:${selectedVideo.id}` : `youtube://watch?v=${selectedVideo.id}`;
    const fallbackUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`;

    try {
      const supported = await Linking.canOpenURL(youtubeAppUrl);
      if (supported) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch {
      Alert.alert('Error', 'Could not open YouTube. Please make sure the app is installed.', [
        { text: 'Open in Browser', onPress: () => Linking.openURL(fallbackUrl) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>&lt; Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Locations</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : videos.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No videos with location data found.</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadVideos}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            onMessage={onMessage}
            style={styles.map}
          />
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          style={styles.bottomSheet}
        >
          <BottomSheetView style={styles.sheetContent}>
            {selectedVideo && (
              <View style={styles.videoDetail}>
                <View style={styles.videoRow}>
                  <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.sheetThumbnail} />
                  <View style={styles.sheetInfo}>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {selectedVideo.title}
                    </Text>
                    <Text style={styles.sheetChannel}>{selectedVideo.channelName}</Text>
                    <Text style={styles.sheetDate}>Published: {selectedVideo.publishedAt}</Text>
                    {selectedVideo.recordingDate && (
                      <Text style={styles.sheetDate}>Recorded: {selectedVideo.recordingDate}</Text>
                    )}
                    {selectedVideo.location && (
                      <Text style={styles.sheetLocation}>
                        📍 {selectedVideo.location.city ? `${selectedVideo.location.city}, ` : ''}
                        {selectedVideo.location.country}
                        {'\n'}
                        ({selectedVideo.location.latitude?.toFixed(6)}, {selectedVideo.location.longitude?.toFixed(6)})
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity style={styles.watchButton} onPress={openInYouTube}>
                  <Text style={styles.watchButtonText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    width: 60,
  },
  backButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
  },
  videoDetail: {
    flex: 1,
  },
  videoRow: {
    flexDirection: 'row',
  },
  sheetThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 4,
  },
  sheetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sheetChannel: {
    fontSize: 14,
    color: '#666',
  },
  sheetDate: {
    fontSize: 12,
    color: '#888',
  },
  sheetLocation: {
    fontSize: 12,
    color: '#4285F4',
    marginTop: 4,
  },
  watchButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  watchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MapScreen;
