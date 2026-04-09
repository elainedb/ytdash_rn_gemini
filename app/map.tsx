import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions, Platform, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useVideosStore } from '../src/features/videos/presentation/stores/videos-store';
import { Image } from 'expo-image';
import { Video } from '../src/features/videos/domain/entities/video';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const { allVideos } = useVideosStore();
  const webViewRef = useRef<WebView>(null);
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Filter videos with coordinates
  const videosWithCoordinates = allVideos.filter(v => v.latitude != null && v.longitude != null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var markers = [];

        function setMarkers(videosData) {
          try {
            // Remove existing
            markers.forEach(m => map.removeLayer(m));
            markers = [];
            
            var bounds = L.latLngBounds();
            var hasValidMarkers = false;

            videosData.forEach(function(video) {
              if (video.latitude && video.longitude) {
                var marker = L.marker([video.latitude, video.longitude]).addTo(map);
                marker.on('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', videoId: video.id }));
                });
                markers.push(marker);
                bounds.extend([video.latitude, video.longitude]);
                hasValidMarkers = true;
              }
            });

            if (hasValidMarkers) {
              map.fitBounds(bounds, { padding: [50, 50] });
            }
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
          }
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (selectedVideo) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedVideo, translateY]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        const markersData = videosWithCoordinates.map(v => ({
          id: v.id,
          latitude: v.latitude,
          longitude: v.longitude
        }));
        webViewRef.current?.injectJavaScript(`setMarkers(${JSON.stringify(markersData)}); true;`);
      } else if (data.type === 'markerClick') {
        const video = allVideos.find(v => v.id === data.videoId);
        if (video) {
          setSelectedVideo(video);
        }
      }
    } catch (e) {
      console.error('WebView message parsing error', e);
    }
  };

  const openVideo = async (videoId: string) => {
    const isIOS = Platform.OS === 'ios';
    const appUrl = isIOS ? `youtube://watch?v=${videoId}` : `vnd.youtube:${videoId}`;
    const altAppUrl = `youtube://watch?v=${videoId}`;
    const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      await Linking.openURL(appUrl);
    } catch (e1) {
      if (!isIOS) {
        try {
          await Linking.openURL(altAppUrl);
        } catch (e2) {
          try {
            await Linking.openURL(webUrl);
          } catch (e3) {
            Alert.alert('Error', 'Cannot open video.');
          }
        }
      } else {
        try {
          await Linking.openURL(webUrl);
        } catch (e2) {
          Alert.alert('Error', 'Cannot open video.');
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Locations</Text>
        <View style={styles.placeholder} />
      </View>

      {videosWithCoordinates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos with location data found.</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.map}
            onMessage={onMessage}
            applicationNameForUserAgent="dev.elainedb.rn_gemini/1.0"
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          {selectedVideo && (
            <TouchableOpacity 
              style={styles.backdrop} 
              activeOpacity={1} 
              onPress={() => setSelectedVideo(null)}
            />
          )}

          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
            {selectedVideo && (
              <View style={styles.bottomSheetContent}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedVideo(null)}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                
                <Image
                  style={styles.thumbnail}
                  source={{ uri: selectedVideo.thumbnailUrl }}
                  contentFit="cover"
                />
                <Text style={styles.title} numberOfLines={2}>{selectedVideo.title}</Text>
                <Text style={styles.channel}>{selectedVideo.channelName}</Text>
                
                <View style={styles.datesRow}>
                  <Text style={styles.dateText}>Pub: {new Date(selectedVideo.publishedAt).toISOString().split('T')[0]}</Text>
                  {selectedVideo.recordingDate && (
                    <Text style={styles.dateText}>Rec: {new Date(selectedVideo.recordingDate).toISOString().split('T')[0]}</Text>
                  )}
                </View>

                <Text style={styles.location}>
                  📍 {[selectedVideo.city, selectedVideo.country].filter(Boolean).join(', ')} ({selectedVideo.latitude?.toFixed(2)}, {selectedVideo.longitude?.toFixed(2)})
                </Text>

                {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {selectedVideo.tags.slice(0, 5).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.watchButton} 
                  onPress={() => openVideo(selectedVideo.id)}
                >
                  <Text style={styles.watchButtonText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheetContent: {
    width: '100%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  location: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  watchButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  watchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
