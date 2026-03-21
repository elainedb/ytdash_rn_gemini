import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Image, Platform, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { fetchAllVideos, VideoData } from '@/services/youtubeApi';

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
    .custom-marker {
      background-color: #4285F4;
      border: 2px solid white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      color: white;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([37.7749, -122.4194], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var markersGroup = L.featureGroup().addTo(map);

    function handleMessage(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'markers') {
          markersGroup.clearLayers();
          data.markers.forEach(function(marker) {
            var icon = L.divIcon({
              className: 'custom-marker',
              html: '📷',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });
            var m = L.marker([marker.lat, marker.lng], { icon: icon }).addTo(markersGroup);
            m.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                videoId: marker.id
              }));
            });
          });
          if (data.markers.length > 0) {
            map.fitBounds(markersGroup.getBounds().pad(0.1));
          }
        }
      } catch(e) {}
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage); // For Android older versions
  </script>
</body>
</html>
`;

export default function MapScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const webviewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const all = await fetchAllVideos(false);
    const withLocation = all.filter(v => v.location?.latitude && v.location?.longitude);
    setVideos(withLocation);
  };

  useEffect(() => {
    if (videos.length > 0) {
      const timer = setTimeout(() => {
        const markers = videos.map(v => ({
          id: v.id,
          lat: v.location!.latitude,
          lng: v.location!.longitude,
        }));
        webviewRef.current?.postMessage(JSON.stringify({ type: 'markers', markers }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [videos]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const vid = videos.find(v => v.id === data.videoId);
        if (vid) {
          setSelectedVideo(vid);
          bottomSheetRef.current?.expand();
        }
      }
    } catch (e) {}
  };

  const watchVideo = async (video: VideoData) => {
    const videoId = video.id;
    const isIOS = Platform.OS === 'ios';
    const appUrl = isIOS ? `youtube://${videoId}` : `vnd.youtube:${videoId}`;
    const altAppUrl = `intent://www.youtube.com/watch?v=${videoId}#Intent;package=com.google.android.youtube;scheme=https;end`;
    const webUrl = video.videoUrl;

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
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Video Locations</Text>
          <View style={styles.spacer} />
        </View>

        {videos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos with location data found</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ html: htmlContent }}
            style={styles.map}
            onMessage={onMessage}
            javaScriptEnabled={true}
          />
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['25%']}
          enablePanDownToClose={true}
        >
          <BottomSheetView style={styles.sheetContent}>
            {selectedVideo && (
              <View style={styles.videoDetails}>
                <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.thumbnail} />
                <View style={styles.info}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{selectedVideo.title}</Text>
                  <Text style={styles.channelName}>{selectedVideo.channelName}</Text>
                  <Text style={styles.dateText}>Published: {selectedVideo.publishedAt}</Text>
                  {selectedVideo.recordingDate && (
                    <Text style={styles.dateText}>Recorded: {selectedVideo.recordingDate}</Text>
                  )}
                  <Text style={styles.locationText}>
                    📍 {selectedVideo.location?.city ? `${selectedVideo.location.city}, ` : ''}{selectedVideo.location?.country || ''} 
                    ({selectedVideo.location?.latitude?.toFixed(6)}, {selectedVideo.location?.longitude?.toFixed(6)})
                  </Text>
                  <Text style={styles.tagsText} numberOfLines={1}>
                    {selectedVideo.tags?.slice(0, 5).join(', ')}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity 
              style={styles.watchButton} 
              onPress={() => selectedVideo && watchVideo(selectedVideo)}
            >
              <Text style={styles.watchButtonText}>Watch on YouTube</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spacer: {
    width: 50,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sheetContent: {
    padding: 15,
    flex: 1,
  },
  videoDetails: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  channelName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#888',
  },
  locationText: {
    fontSize: 10,
    color: '#444',
    marginTop: 2,
  },
  tagsText: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  watchButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  watchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
