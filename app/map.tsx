import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions, Platform, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useVideosStore } from '../src/features/videos/presentation/stores/videos-store';
import { Image } from 'expo-image';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MapScreen() {
  const { allVideos } = useVideosStore();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const webViewRef = useRef<WebView>(null);

  const videosWithCoordinates = useMemo(() => {
    return allVideos.filter(v => v.latitude !== null && v.longitude !== null);
  }, [allVideos]);

  const selectedVideo = videosWithCoordinates.find(v => v.id === selectedVideoId);

  const openPanel = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const closePanel = () => {
    Animated.spring(slideAnim, {
      toValue: SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      setSelectedVideoId(null);
    });
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick' && data.videoId) {
        setSelectedVideoId(data.videoId);
        openPanel();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openVideo = async () => {
    if (!selectedVideo) return;
    const isIOS = Platform.OS === 'ios';
    const appUrl = isIOS ? `youtube://watch?v=${selectedVideo.id}` : `vnd.youtube:${selectedVideo.id}`;
    const altAppUrl = `youtube://watch?v=${selectedVideo.id}`;
    const webUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`;

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

  const mapHtml = `
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
        var map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var markers = [];
        var videos = ${JSON.stringify(videosWithCoordinates.map(v => ({ id: v.id, title: v.title, lat: v.latitude, lng: v.longitude })))};
        
        if (videos.length > 0) {
          var bounds = L.latLngBounds();
          videos.forEach(function(v) {
            var marker = L.marker([v.lat, v.lng]).addTo(map);
            marker.bindTooltip(v.title);
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', videoId: v.id }));
            });
            bounds.extend([v.lat, v.lng]);
          });
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Video Locations</Text>
        <View style={{ width: 60 }} />
      </View>

      {videosWithCoordinates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos with location data found.</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            onMessage={onMessage}
            applicationNameForUserAgent="dev.elainedb.rn_gemini/1.0"
            style={styles.webview}
          />
        </View>
      )}

      {selectedVideoId && (
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closePanel}>
          <View style={styles.backdropInner} />
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.bottomPanel, { transform: [{ translateY: slideAnim }] }]}>
        {selectedVideo && (
          <View style={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle} numberOfLines={2}>{selectedVideo.title}</Text>
              <TouchableOpacity onPress={closePanel}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.panelThumbnail} contentFit="cover" />
            
            <Text style={styles.panelChannel}>{selectedVideo.channelName}</Text>
            
            <View style={styles.panelDetails}>
               <Text style={styles.detailText}>
                 {selectedVideo.city ? `${selectedVideo.city}, ` : ''}{selectedVideo.country || 'Unknown Location'}
               </Text>
               <Text style={styles.coordsText}>
                 {selectedVideo.latitude?.toFixed(4)}, {selectedVideo.longitude?.toFixed(4)}
               </Text>
               <Text style={styles.dateText}>Published: {new Date(selectedVideo.publishedAt).toISOString().split('T')[0]}</Text>
               {selectedVideo.recordingDate && (
                 <Text style={styles.dateText}>Recorded: {new Date(selectedVideo.recordingDate).toISOString().split('T')[0]}</Text>
               )}
            </View>

            {selectedVideo.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {selectedVideo.tags.slice(0, 5).map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.watchButton} onPress={openVideo}>
              <Text style={styles.watchButtonText}>Watch on YouTube</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
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
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#4285F4',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 2,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  panelContent: {
    flexDirection: 'column',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  panelTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  closeText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: 'bold',
  },
  panelThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  panelChannel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  panelDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  coordsText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#555',
  },
  watchButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  watchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
