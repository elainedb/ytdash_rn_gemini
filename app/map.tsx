import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Alert, Linking, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';

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
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([37.7749, -122.4194], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var markers = L.featureGroup().addTo(map);

        function addMarkers(videoDataStr) {
            try {
                var videos = JSON.parse(videoDataStr);
                videos.forEach(function(video) {
                    if (video.lat && video.lng) {
                        var icon = L.divIcon({
                            className: 'custom-marker',
                            html: '📷',
                            iconSize: [28, 28],
                            iconAnchor: [14, 14]
                        });
                        var marker = L.marker([video.lat, video.lng], {icon: icon})
                            .on('click', function() {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'markerClick',
                                    videoId: video.id
                                }));
                            });
                        markers.addLayer(marker);
                    }
                });
                if (videos.length > 0) {
                    map.fitBounds(markers.getBounds().pad(0.1));
                }
            } catch(e) {
                console.error(e);
            }
        }

        window.addEventListener('message', function(event) {
            addMarkers(event.data);
        });
        document.addEventListener('message', function(event) {
            addMarkers(event.data);
        });
    </script>
</body>
</html>
`;

export default function MapScreen() {
  const [videosWithLocation, setVideosWithLocation] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['25%'], []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allVideos = await fetchAllVideos(false); // don't force refresh
    const locationVideos = allVideos.filter(v => v.location?.latitude && v.location?.longitude);
    setVideosWithLocation(locationVideos);
    setLoading(false);
  };

  const handleWebViewLoad = () => {
    // Send markers data to webview after 1s delay as specified in SPEC
    setTimeout(() => {
      const markersData = videosWithLocation.map(v => ({
        id: v.id,
        lat: v.location?.latitude,
        lng: v.location?.longitude
      }));
      webViewRef.current?.postMessage(JSON.stringify(markersData));
    }, 1000);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const video = videosWithLocation.find(v => v.id === data.videoId);
        if (video) {
          setSelectedVideo(video);
          bottomSheetRef.current?.expand();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWatchVideo = async () => {
    if (!selectedVideo) return;
    
    const iosUrl = `youtube://watch?v=${selectedVideo.id}`;
    const androidUrl = `vnd.youtube:${selectedVideo.id}`;
    const webUrl = selectedVideo.videoUrl;

    try {
      const isAndroid = Platform.OS === 'android';
      const appUrl = isAndroid ? androidUrl : iosUrl;
      
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert('Error', 'Could not open the video. Please install the YouTube app or check your browser.');
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Video Locations</Text>
          <View style={styles.spacer} />
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <Text>Loading map...</Text>
          </View>
        ) : videosWithLocation.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noDataText}>No videos with location data found</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadData}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent }}
              onLoadEnd={handleWebViewLoad}
              onMessage={handleMessage}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        )}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            {selectedVideo && (
              <View style={styles.videoDetails}>
                <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.thumbnail} />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{selectedVideo.title}</Text>
                  <Text style={styles.videoChannel} numberOfLines={1}>{selectedVideo.channelName}</Text>
                  
                  <View style={styles.dateRow}>
                    <Text style={styles.detailText}>Pub: {selectedVideo.publishedAt}</Text>
                    {selectedVideo.recordingDate && (
                      <Text style={styles.detailText}> • Rec: {selectedVideo.recordingDate}</Text>
                    )}
                  </View>

                  {selectedVideo.location && (
                    <Text style={styles.detailText} numberOfLines={1}>
                      📍 {selectedVideo.location.city || ''}{selectedVideo.location.city && selectedVideo.location.country ? ', ' : ''}{selectedVideo.location.country || ''} 
                      ({selectedVideo.location.latitude?.toFixed(6)}, {selectedVideo.location.longitude?.toFixed(6)})
                    </Text>
                  )}

                  <Text style={styles.tagsText} numberOfLines={1}>
                    {selectedVideo.tags.slice(0, 5).join(', ')}
                  </Text>
                </View>

                <TouchableOpacity style={styles.watchButton} onPress={handleWatchVideo}>
                  <Text style={styles.watchButtonText}>Watch on YouTube</Text>
                </TouchableOpacity>
              </View>
            )}
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
    paddingTop: Platform.OS === 'android' ? 25 : 0,
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
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 60, // approximate width of back button to keep title centered
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  videoDetails: {
    flex: 1,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  videoInfo: {
    paddingRight: 90, // space for thumbnail
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  videoChannel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  tagsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 16,
  },
  watchButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  watchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
