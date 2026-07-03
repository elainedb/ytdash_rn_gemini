import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Video } from '../types';

interface MapScreenProps {
  videos: Video[];
  onNavigateBack: () => void;
  onOpenVideo: (video: Video) => void;
}

export default function MapScreen({ videos, onNavigateBack, onOpenVideo }: MapScreenProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const webViewRef = useRef<any>(null);

  // Filter only videos with valid locations
  const geolocatedVideos = useMemo(() => {
    return videos.filter((v) => v.lat !== null && v.lng !== null);
  }, [videos]);

  // Construct Leaflet HTML with embedded geolocated videos
  const mapHtml = useMemo(() => {
    const videosJson = JSON.stringify(
      geolocatedVideos.map((v) => ({
        id: v.id,
        title: v.title,
        lat: v.lat,
        lng: v.lng,
      }))
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #0F172A;
          }
          /* Custom styling for Leaflet controls to look more premium */
          .leaflet-bar {
            border: none !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          }
          .leaflet-bar a {
            background-color: #1E293B !important;
            color: #F8FAFC !important;
            border-bottom: 1px solid #334155 !important;
          }
          .leaflet-bar a:hover {
            background-color: #334155 !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          try {
            var map = L.map('map', { zoomControl: true }).setView([20, 0], 2);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            var videosData = ${videosJson};
            var markers = [];

            videosData.forEach(function(video) {
              if (video.lat && video.lng) {
                var marker = L.marker([video.lat, video.lng]).addTo(map);
                marker.on('click', function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'marker_tap',
                      videoId: video.id
                    }));
                  }
                });
                markers.push(marker);
              }
            });

            if (markers.length > 0) {
              var group = new L.featureGroup(markers);
              map.fitBounds(group.getBounds().pad(0.1));
            }

            // Listen for focus messages from React Native
            window.addEventListener('message', function(event) {
              try {
                var data = JSON.parse(event.data);
                if (data.type === 'focus_video') {
                  map.setView([data.lat, data.lng], 14);
                }
              } catch (e) {}
            });
          } catch (err) {
            document.body.innerHTML = '<div style="color: white; padding: 20px;">Failed to initialize map: ' + err.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
  }, [geolocatedVideos]);

  // Handle messages from the Webview (human taps on OSM map pins)
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_tap') {
        const video = geolocatedVideos.find((v) => v.id === data.videoId);
        if (video) {
          setSelectedVideo(video);
        }
      }
    } catch (e) {
      console.warn('Failed to parse WebView message:', e);
    }
  };

  const handleChipTap = (video: Video) => {
    setSelectedVideo(video);
    // Send a message to WebView to center on this coordinate
    if (webViewRef.current && video.lat !== null && video.lng !== null) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'focus_video',
          lat: video.lat,
          lng: video.lng,
        })
      );
    }
  };

  const renderMarkerChip = ({ item }: { item: Video }) => {
    const isSelected = selectedVideo?.id === item.id;
    return (
      <Pressable
        onPress={() => handleChipTap(item)}
        style={({ pressed }) => [
          styles.markerChip,
          isSelected && styles.markerChipSelected,
          pressed && styles.markerChipPressed,
        ]}
        testID="map_marker"
      >
        <Text style={[styles.markerChipText, isSelected && styles.markerChipTextSelected]} numberOfLines={1}>
          📍 {item.title}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container} testID="screen_map">
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable onPress={onNavigateBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>◀ Back to Feeds</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Interactive Map</Text>
      </View>

      {/* Embedded Leaflet map in WebView */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.webview}
          onMessage={handleMessage}
          renderLoading={() => (
            <View style={styles.loadingContainer} testID="loading_indicator">
              <ActivityIndicator size="large" color="#EF4444" />
            </View>
          )}
          startInLoadingState
        />
      </View>

      {/* Horizontal Native Marker Affordance Row (constitution §5 / Maestro accessibility helper) */}
      <View style={styles.nativeMarkersWrapper}>
        <Text style={styles.nativeMarkersTitle}>Select Location Marker:</Text>
        <FlatList
          horizontal
          data={geolocatedVideos}
          renderItem={renderMarkerChip}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nativeMarkersList}
        />
      </View>

      {/* Native Bottom Sheet details panel */}
      {selectedVideo && (
        <View style={styles.bottomSheet} testID="detail_bottom_sheet">
          <View style={styles.sheetHeader}>
            <View style={styles.sheetBadge}>
              <Text style={styles.sheetBadgeText}>{selectedVideo.category?.toUpperCase()}</Text>
            </View>
            <Pressable onPress={() => setSelectedVideo(null)} style={styles.sheetCloseBtn}>
              <Text style={styles.sheetCloseBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sheetTitle} numberOfLines={2}>
            {selectedVideo.title}
          </Text>

          {/* detail_video_url must carry the exact YouTube watch link as its text */}
          <View style={styles.sheetUrlContainer}>
            <Text style={styles.sheetUrl} testID="detail_video_url">
              {selectedVideo.youtubeUrl}
            </Text>
          </View>

          <Pressable
            onPress={() => onOpenVideo(selectedVideo)}
            style={({ pressed }) => [
              styles.sheetActionBtn,
              pressed && styles.sheetActionBtnPressed,
            ]}
            testID="detail_open_youtube_button"
          >
            <Text style={styles.sheetActionBtnText}>Open in YouTube</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginRight: 16,
  },
  backBtnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeMarkersWrapper: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  nativeMarkersTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nativeMarkersList: {
    paddingHorizontal: 16,
  },
  markerChip: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#475569',
    maxWidth: 220,
  },
  markerChipSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  markerChipPressed: {
    opacity: 0.85,
  },
  markerChipText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  markerChipTextSelected: {
    color: '#EF4444',
    fontWeight: '700',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    zIndex: 999,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sheetBadgeText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
  },
  sheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 24,
    marginBottom: 12,
  },
  sheetUrlContainer: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sheetUrl: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  sheetActionBtn: {
    height: 50,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetActionBtnPressed: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 0.98 }],
  },
  sheetActionBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
});
