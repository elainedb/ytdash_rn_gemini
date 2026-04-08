import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Animated, Dimensions, Platform, Alert, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { useVideosStore } from '@/src/features/videos/presentation/stores/videos-store';
import { Video } from '@/src/features/videos/domain/entities/video';
import { container } from '@/src/core/di/container';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const { filteredVideos, refreshVideos } = useVideosStore();
  
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Filter videos to only those with coordinates
  const locationVideos = filteredVideos.filter(
    (v) => v.latitude !== null && v.longitude !== null
  );

  const handleMarkerPress = (video: Video) => {
    setSelectedVideo(video);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedVideo(null));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Video Locations</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (locationVideos.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos with location data found.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => refreshVideos(container.getVideos)}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
          body { padding: 0; margin: 0; }
          #map { height: 100vh; width: 100vw; }
      </style>
  </head>
  <body>
      <div id="map"></div>
      <script>
          var map = L.map('map').setView([0, 0], 2);
          L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
  
          var bounds = L.latLngBounds();
  
          ${locationVideos.map(v => `
              (function() {
                  var marker = L.marker([${v.latitude}, ${v.longitude}]).addTo(map);
                  marker.on('click', function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', videoId: '${v.id}' }));
                  });
                  bounds.extend(marker.getLatLng());
              })();
          `).join('')}
  
          if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [50, 50] });
          }
      </script>
  </body>
  </html>
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      
      <View style={styles.container}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'markerClick') {
                const video = locationVideos.find(v => v.id === data.videoId);
                if (video) handleMarkerPress(video);
              }
            } catch (e) {
              console.log('Error parsing WebView message', e);
            }
          }}
        />

        {/* Backdrop for closing bottom sheet */}
        {selectedVideo && (
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={closeBottomSheet} 
          />
        )}

        {/* Animated Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {selectedVideo && (
            <View style={styles.sheetContent}>
              <View style={styles.sheetHeader}>
                <View style={styles.dragHandle} />
              </View>
              
              <ScrollView>
                <Image
                  source={{ uri: selectedVideo.thumbnailUrl }}
                  style={styles.thumbnail}
                  contentFit="cover"
                />
                
                <Text style={styles.title} numberOfLines={2}>
                  {selectedVideo.title}
                </Text>
                
                <Text style={styles.channelName}>
                  {selectedVideo.channelName}
                </Text>

                <View style={styles.detailsRow}>
                  <Text style={styles.detailText}>
                    Published: {formatDate(selectedVideo.publishedAt)}
                  </Text>
                  {selectedVideo.recordingDate && (
                    <Text style={styles.detailText}>
                      Recorded: {formatDate(selectedVideo.recordingDate)}
                    </Text>
                  )}
                </View>

                <View style={styles.locationContainer}>
                  <Text style={styles.locationText}>
                    {selectedVideo.city ? `${selectedVideo.city}, ` : ''}{selectedVideo.country}
                  </Text>
                  <Text style={styles.coordinatesText}>
                    {selectedVideo.latitude?.toFixed(4)}, {selectedVideo.longitude?.toFixed(4)}
                  </Text>
                </View>

                {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {selectedVideo.tags.slice(0, 5).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                    {selectedVideo.tags.length > 5 && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>+{selectedVideo.tags.length - 5} more</Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.youtubeButton} 
                  onPress={() => openVideo(selectedVideo.id)}
                >
                  <Text style={styles.youtubeButtonText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60, // approximate width of back button to keep title centered
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: SCREEN_HEIGHT * 0.6,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  locationContainer: {
    backgroundColor: '#f1f3f4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#777',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#eee',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#444',
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  youtubeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
