import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useVideoState } from '../hooks/useVideoState';

const WebViewAny = WebView as any;

export const MapViewComponent: React.FC = () => {
  const { filteredVideos, selectedVideoIdForMapSheet, setSelectedVideoIdForMapSheet } = useVideoState();
  const webViewRef = useRef<any>(null);

  // Filter to only geotagged videos
  const locatedVideos = useMemo(() => {
    return filteredVideos.filter(v => v.location !== null);
  }, [filteredVideos]);

  // Leaflet map HTML representation
  const htmlContent = useMemo(() => {
    const markersJson = JSON.stringify(
      locatedVideos.map(v => ({
        id: v.id,
        title: v.title,
        lat: v.location!.lat,
        lng: v.location!.lng,
      }))
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map {
            margin: 0; padding: 0; width: 100vw; height: 100vh;
            background-color: #0F172A;
          }
          /* Custom leaflet overrides */
          .leaflet-bar { border: none !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
          .leaflet-bar a { background-color: #1E293B !important; color: #F1F5F9 !important; border-bottom: 1px solid #334155 !important; }
          .leaflet-bar a:hover { background-color: #334155 !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map centered on central Europe
          var map = L.map('map', { zoomControl: true }).setView([47.0, 5.0], 4);
          
          // Load Dark/Sleek OSM Tiles
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            maxZoom: 20
          }).addTo(map);

          var markers = ${markersJson};
          var markerInstances = {};

          markers.forEach(function(m) {
            var marker = L.marker([m.lat, m.lng]).addTo(map);
            markerInstances[m.id] = marker;
            
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'marker_tap',
                id: m.id
              }));
            });
          });

          // Handle message from React Native (for bidirectional sync if needed)
          window.addEventListener('message', function(event) {
            try {
              var data = JSON.parse(event.data);
              if (data.type === 'focus_marker' && markerInstances[data.id]) {
                var inst = markerInstances[data.id];
                map.setView(inst.getLatLng(), 8);
              }
            } catch(e) {}
          });
        </script>
      </body>
      </html>
    `;
  }, [locatedVideos]);

  // Handle messages sent from Leaflet inside WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_tap') {
        console.log(`[WebView] Marker clicked in map: ${data.id}`);
        setSelectedVideoIdForMapSheet(data.id);
      }
    } catch (err) {
      console.error('[WebView] Error parsing WebView message:', err);
    }
  };

  // Sync native chips action with WebView Map panning
  const handleChipPress = (id: string) => {
    console.log(`[UI] Native marker chip tapped: ${id}`);
    setSelectedVideoIdForMapSheet(id);
    
    // Send focus message to webview to center map
    const selectedVideo = locatedVideos.find(v => v.id === id);
    if (selectedVideo && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'focus_marker',
        id: id
      }));
    }
  };

  return (
    <View testID="screen_map" style={styles.container}>
      {locatedVideos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No geolocated videos available</Text>
        </View>
      ) : (
        <>
          <WebViewAny
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.webView}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
          />

          {/* Horizontal scrollable row of native map_marker chips for accessibility/Maestro */}
          <View style={styles.nativeMarkersContainer}>
            <Text style={styles.overlayTitle}>Located Videos ({locatedVideos.length})</Text>
            <ScrollView 
              horizontal 
              contentContainerStyle={styles.markersScroll} 
              showsHorizontalScrollIndicator={false}
            >
              {locatedVideos.map((video) => {
                const isSelected = selectedVideoIdForMapSheet === video.id;
                return (
                  <Pressable
                    key={video.id}
                    testID="map_marker"
                    style={[
                      styles.markerChip,
                      isSelected && styles.markerChipSelected
                    ]}
                    onPress={() => handleChipPress(video.id)}
                  >
                    <Text style={[
                      styles.markerChipText,
                      isSelected && styles.markerChipTextSelected
                    ]}>
                      📍 {video.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  nativeMarkersContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Glassmorphism backdrop Slate 900
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  overlayTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 16,
    marginBottom: 8,
  },
  markersScroll: {
    paddingHorizontal: 16,
    gap: 10,
    height: 44,
    alignItems: 'center',
  },
  markerChip: {
    backgroundColor: '#1E293B', // Slate 800
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  markerChipSelected: {
    backgroundColor: '#4338CA', // Indigo 700
    borderColor: '#6366F1', // Indigo 500
  },
  markerChipText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  markerChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
