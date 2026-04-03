import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Linking, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { fetchAllVideos, VideoData } from '../services/youtubeApi';
import { Image } from 'expo-image';

export default function MapScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const webviewRef = useRef<WebView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['25%'], []);

  useEffect(() => {
    const loadData = async () => {
      const all = await fetchAllVideos(false);
      const withLocation = all.filter(v => v.location?.latitude !== undefined && v.location?.longitude !== undefined);
      setVideos(withLocation);
    };
    loadData();
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const video = videos.find(v => v.id === data.videoId);
        if (video) {
          setSelectedVideo(video);
          bottomSheetRef.current?.expand();
        }
      }
    } catch (error) {
      console.error('Map message error', error);
    }
  };

  const handleWatch = async () => {
    if (!selectedVideo) return;

    const youtubeAppUrl = Platform.OS === 'ios' ? `youtube://${selectedVideo.id}` : `vnd.youtube:${selectedVideo.id}`;
    const altAndroidUrl = `intent://www.youtube.com/watch?v=${selectedVideo.id}#Intent;package=com.google.android.youtube;scheme=https;end;`;
    const webUrl = selectedVideo.videoUrl;

    try {
      const canOpenApp = await Linking.canOpenURL(youtubeAppUrl);
      if (canOpenApp) {
        await Linking.openURL(youtubeAppUrl);
      } else if (Platform.OS === 'android') {
        const canOpenAlt = await Linking.canOpenURL(altAndroidUrl);
        if (canOpenAlt) {
          await Linking.openURL(altAndroidUrl);
        } else {
          await Linking.openURL(webUrl);
        }
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert('Error', 'Could not open video. Please ensure you have a web browser or the YouTube app installed.');
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
        #map { height: 100vh; width: 100vw; }
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
        const map = L.map('map').setView([37.7749, -122.4194], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const markersGroup = L.featureGroup().addTo(map);

        window.addMarkers = (videosData) => {
          const videos = JSON.parse(videosData);
          videos.forEach(v => {
            const icon = L.divIcon({
              className: 'custom-marker',
              html: '📷',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            });

            const marker = L.marker([v.location.latitude, v.location.longitude], { icon });
            marker.on('click', () => {
              const msg = JSON.stringify({ type: 'markerClick', videoId: v.id });
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(msg);
              }
            });
            markersGroup.addLayer(marker);
          });

          if (videos.length > 0) {
            map.fitBounds(markersGroup.getBounds().pad(0.1));
          }
        };

        // Listen for messages from React Native
        document.addEventListener('message', function(e) {
          try {
            const data = JSON.parse(e.data);
            if(data.type === 'addMarkers') {
              window.addMarkers(JSON.stringify(data.videos));
            }
          } catch(err) {}
        });
        window.addEventListener('message', function(e) {
          try {
            const data = JSON.parse(e.data);
            if(data.type === 'addMarkers') {
              window.addMarkers(JSON.stringify(data.videos));
            }
          } catch(err) {}
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (videos.length > 0 && webviewRef.current) {
      setTimeout(() => {
        const script = `
          try {
            window.addMarkers('${JSON.stringify(videos).replace(/'/g, "\\'")}');
          } catch(e) {}
          true;
        `;
        webviewRef.current?.injectJavaScript(script);
      }, 1000);
    }
  }, [videos]);

  if (videos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Video Locations</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text>No videos with location data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{'< Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Video Locations</Text>
          <View style={{ width: 60 }} />
        </View>

        <WebView
          ref={webviewRef}
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled={true}
        />

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
        >
          <BottomSheetView style={styles.sheetContent}>
            {selectedVideo && (
              <View style={styles.sheetInner}>
                <Image source={{ uri: selectedVideo.thumbnailUrl }} style={styles.sheetThumb} />
                <View style={styles.sheetTextContainer}>
                  <Text style={styles.sheetTitle} numberOfLines={2}>{selectedVideo.title}</Text>
                  <Text style={styles.sheetChannel} numberOfLines={1}>{selectedVideo.channelName}</Text>
                  <Text style={styles.sheetDate}>Pub: {selectedVideo.publishedAt}</Text>
                  {selectedVideo.recordingDate && <Text style={styles.sheetDate}>Rec: {selectedVideo.recordingDate}</Text>}
                  <Text style={styles.sheetLocation}>
                    📍 {selectedVideo.location?.city ? `${selectedVideo.location.city}, ` : ''}{selectedVideo.location?.country || ''}
                    {` (${selectedVideo.location?.latitude?.toFixed(6)}, ${selectedVideo.location?.longitude?.toFixed(6)})`}
                  </Text>
                  {selectedVideo.tags.length > 0 && (
                    <Text style={styles.sheetTags} numberOfLines={1}>
                      {selectedVideo.tags.slice(0, 5).join(', ')}
                    </Text>
                  )}
                  <TouchableOpacity style={styles.watchBtn} onPress={handleWatch}>
                    <Text style={styles.watchBtnText}>Watch on YouTube</Text>
                  </TouchableOpacity>
                </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    color: '#4285F4',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  sheetContent: {
    flex: 1,
    padding: 16,
  },
  sheetInner: {
    flexDirection: 'row',
  },
  sheetThumb: {
    width: 80,
    height: 60,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  sheetTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sheetChannel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  sheetDate: {
    fontSize: 12,
    color: '#666',
  },
  sheetLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sheetTags: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  watchBtn: {
    backgroundColor: '#FF0000',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  watchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
