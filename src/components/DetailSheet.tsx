import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, ActivityIndicator } from 'react-native';
import { useVideoState } from '../hooks/useVideoState';
import { reverseGeocode } from '../services/geocode';
import { openVideoLink } from '../utils/openLink';

export const DetailSheet: React.FC = () => {
  const { 
    selectedVideoIdForMapSheet, 
    setSelectedVideoIdForMapSheet, 
    videos,
    testConfig,
    setCapturedUrl,
    setExternalOpenError
  } = useVideoState();

  const [placeName, setPlaceName] = useState<string>('Loading location...');
  const [geocoding, setGeocoding] = useState(false);

  // Find the selected video
  const video = videos.find(v => v.id === selectedVideoIdForMapSheet);

  useEffect(() => {
    if (!video || !video.location) {
      setPlaceName('');
      return;
    }

    let active = true;
    async function resolveGeocode() {
      setGeocoding(true);
      setPlaceName('Resolving location...');
      try {
        const resolved = await reverseGeocode(video!.location!);
        if (active) {
          setPlaceName(resolved);
        }
      } catch (err) {
        if (active) {
          setPlaceName('Unknown Location');
        }
      } finally {
        if (active) {
          setGeocoding(false);
        }
      }
    }

    resolveGeocode();
    return () => {
      active = false;
    };
  }, [selectedVideoIdForMapSheet, video]);

  if (!video) return null;

  const handleOpenYoutube = async () => {
    console.log(`[UI] Opened video from map sheet: "${video.title}"`);
    await openVideoLink(
      video.youtubeUrl,
      !!testConfig?.captureExternalLinks,
      setCapturedUrl,
      setExternalOpenError
    );
  };

  return (
    <View testID="detail_bottom_sheet" style={styles.sheetContainer}>
      <View style={styles.header}>
        <Text style={styles.sheetTitle}>Video Location Details</Text>
        <Pressable 
          style={styles.closeButton} 
          onPress={() => setSelectedVideoIdForMapSheet(null)}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.videoRow}>
          {video.thumbnailUrl ? (
            <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
            <Text style={styles.videoCategory}>{video.category}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Location Info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📍 Location Name:</Text>
          {geocoding ? (
            <ActivityIndicator size="small" color="#6366F1" style={styles.spinner} />
          ) : (
            <Text style={styles.infoValue}>{placeName}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🌐 Coordinates:</Text>
          <Text style={styles.infoValue}>
            {video.location?.lat.toFixed(4)}°, {video.location?.lng.toFixed(4)}°
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🔗 Video URL:</Text>
          {/* MUST expose exactly the watch URL as the text */}
          <Text testID="detail_video_url" style={styles.videoUrlText}>
            {video.youtubeUrl}
          </Text>
        </View>

        <Pressable 
          testID="detail_open_youtube_button" 
          style={styles.openButton}
          onPress={handleOpenYoutube}
        >
          <Text style={styles.openButtonText}>Open in YouTube</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B', // Slate 800
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#475569',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    gap: 12,
  },
  videoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  placeholderThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  textContainer: {
    flex: 1,
  },
  videoTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  videoCategory: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'column',
    gap: 2,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  videoUrlText: {
    color: '#38BDF8', // Light blue
    fontSize: 13,
    fontWeight: 'bold',
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  openButton: {
    backgroundColor: '#6366F1', // Indigo 500
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
