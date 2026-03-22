import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, Image } from 'react-native';
import { VideoData } from '../services/youtubeApi';

interface Props {
  video: VideoData;
}

export default function VideoItem({ video }: Props) {
  const handlePress = async () => {
    const iosUrl = `youtube://${video.id}`;
    const androidUrl = `vnd.youtube:${video.id}`;
    const webUrl = video.videoUrl;

    try {
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL(iosUrl);
        if (canOpen) {
          await Linking.openURL(iosUrl);
        } else {
          await Linking.openURL(webUrl);
        }
      } else {
        const canOpen = await Linking.canOpenURL(androidUrl);
        if (canOpen) {
          await Linking.openURL(androidUrl);
        } else {
          await Linking.openURL(webUrl);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open video. Please install the YouTube app or check your browser.');
    }
  };

  const hasLocation = video.location?.city || video.location?.country;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channel} numberOfLines={1}>{video.channelName}</Text>
        <Text style={styles.metaText}>Published: {video.publishedAt}</Text>
        {video.recordingDate ? (
          <Text style={styles.metaText}>Recorded: {video.recordingDate}</Text>
        ) : null}
        {hasLocation ? (
          <Text style={styles.metaText}>📍 {video.location?.city ? `${video.location.city}, ` : ''}{video.location?.country || ''}</Text>
        ) : null}
        {video.tags.length > 0 ? (
          <Text style={styles.tags} numberOfLines={1}>
            {video.tags.slice(0, 5).join(', ')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  channel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  tags: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
