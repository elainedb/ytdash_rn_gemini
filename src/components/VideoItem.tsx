import React from 'react';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import { Video } from '../services/api';
import { useVideoState } from '../hooks/useVideoState';
import { openVideoLink } from '../utils/openLink';

interface VideoItemProps {
  video: Video;
}

export const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const { testConfig, setCapturedUrl, setExternalOpenError } = useVideoState();

  const handlePress = async () => {
    console.log(`[UI] Tapped video: "${video.title}"`);
    await openVideoLink(
      video.youtubeUrl,
      !!testConfig?.captureExternalLinks,
      setCapturedUrl,
      setExternalOpenError
    );
  };

  return (
    <Pressable
      testID="video_list_item"
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={handlePress}
    >
      {video.thumbnailUrl ? (
        <Image 
          source={{ uri: video.thumbnailUrl }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
          <Text style={styles.placeholderText}>YT</Text>
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {video.description}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{video.category}</Text>
          </View>
          {video.location && (
            <View style={[styles.badge, styles.locationBadge]}>
              <Text style={styles.locationBadgeText}>📍 Geotagged</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E293B', // Slate 800
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    backgroundColor: '#334155', // Slate 700
    opacity: 0.9,
  },
  thumbnail: {
    width: 100,
    height: 75,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  description: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#334155',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationBadge: {
    backgroundColor: '#1E1B4B', // Indigo 950
    borderColor: '#4338CA',
    borderWidth: 0.5,
  },
  locationBadgeText: {
    color: '#818CF8', // Indigo 400
    fontSize: 10,
    fontWeight: '600',
  },
});
