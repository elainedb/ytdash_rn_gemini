import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert, Platform } from 'react-native';
import { VideoData } from '@/services/youtubeApi';

interface VideoItemProps {
  video: VideoData;
}

export default function VideoItem({ video }: VideoItemProps) {
  const handlePress = async () => {
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

  const tagsDisplay = video.tags?.slice(0, 5).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channelName} numberOfLines={1}>{video.channelName}</Text>
        <Text style={styles.date}>Published: {video.publishedAt}</Text>
        {video.recordingDate && (
          <Text style={styles.date}>Recorded: {video.recordingDate}</Text>
        )}
        {video.location && (video.location.city || video.location.country) && (
          <Text style={styles.location}>
            📍 {video.location.city ? `${video.location.city}, ` : ''}{video.location.country || ''}
          </Text>
        )}
        {tagsDisplay ? (
          <Text style={styles.tags} numberOfLines={1}>{tagsDisplay}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  location: {
    fontSize: 12,
    color: '#444',
    marginTop: 2,
  },
  tags: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
