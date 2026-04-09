import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Video, locationText } from '../../domain/entities/video';

interface VideoItemProps {
  video: Video;
}

export const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const openVideo = async () => {
    const isIOS = Platform.OS === 'ios';
    const appUrl = isIOS ? `youtube://watch?v=${video.id}` : `vnd.youtube:${video.id}`;
    const altAppUrl = `youtube://watch?v=${video.id}`;
    const webUrl = `https://www.youtube.com/watch?v=${video.id}`;

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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <TouchableOpacity style={styles.card} onPress={openVideo} activeOpacity={0.8}>
      <Image
        source={{ uri: video.thumbnailUrl }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.channelName} numberOfLines={1}>
          {video.channelName}
        </Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>Pub: {formatDate(video.publishedAt)}</Text>
          {video.recordingDate && (
            <Text style={styles.dateText}>Rec: {formatDate(video.recordingDate)}</Text>
          )}
        </View>
        <Text style={styles.locationText}>{locationText(video)}</Text>
        {video.latitude && video.longitude && (
          <Text style={styles.coordsText}>
            {video.latitude.toFixed(4)}, {video.longitude.toFixed(4)}
          </Text>
        )}
        {video.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {video.tags.slice(0, 5).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {video.tags.length > 5 && (
              <Text style={styles.moreTags}>+{video.tags.length - 5} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  channelName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  locationText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 2,
  },
  coordsText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#333',
  },
  moreTags: {
    fontSize: 11,
    color: '#666',
  },
});
