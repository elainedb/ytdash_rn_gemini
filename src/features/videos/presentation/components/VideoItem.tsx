import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Video } from '../../domain/entities/video';
import { ThemedView } from '@/components/themed-view';

interface VideoItemProps {
  video: Video;
}

export const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const handlePress = async () => {
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

  const renderTags = () => {
    if (!video.tags || video.tags.length === 0) return null;
    const displayTags = video.tags.slice(0, 5);
    const overflowCount = video.tags.length - 5;

    return (
      <View style={styles.tagsContainer}>
        {displayTags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {overflowCount > 0 && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>+{overflowCount} more</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <ThemedView style={styles.container}>
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
          <Text style={styles.date}>Published: {formatDate(video.publishedAt)}</Text>
          {video.recordingDate && (
            <Text style={styles.date}>Recorded: {formatDate(video.recordingDate)}</Text>
          )}
          
          {(video.city || video.country) && (
            <Text style={styles.location}>
              {video.city ? `${video.city}, ` : ''}{video.country}
            </Text>
          )}
          
          {(video.latitude !== null && video.longitude !== null) && (
            <Text style={styles.coordinates}>
              {video.latitude.toFixed(4)}, {video.longitude.toFixed(4)}
            </Text>
          )}

          {renderTags()}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff', // Assuming light mode default, theming can be expanded
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginHorizontal: 16,
  },
  thumbnail: {
    width: '100%',
    height: 200,
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
    color: '#555',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
    fontWeight: '500',
  },
  coordinates: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#eee',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#333',
  },
});
