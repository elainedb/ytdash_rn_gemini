import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { VideoData } from '../services/youtubeApi';

interface VideoItemProps {
  video: VideoData;
}

export function VideoItem({ video }: VideoItemProps) {
  const handlePress = async () => {
    const iosUrl = `youtube://watch?v=${video.id}`;
    const androidUrl = `vnd.youtube:${video.id}`;
    const webUrl = video.videoUrl;

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

  const tagsStr = video.tags.slice(0, 5).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channelName} numberOfLines={1}>{video.channelName}</Text>
        <Text style={styles.dateText}>Published: {video.publishedAt}</Text>
        {video.recordingDate ? <Text style={styles.dateText}>Recorded: {video.recordingDate}</Text> : null}
        
        {(video.location?.city || video.location?.country) ? (
          <Text style={styles.locationText}>
            📍 {[video.location.city, video.location.country].filter(Boolean).join(', ')}
          </Text>
        ) : null}

        {tagsStr ? <Text style={styles.tagsText} numberOfLines={1}>{tagsStr}</Text> : null}
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
    backgroundColor: '#ddd',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  channelName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#444',
    marginTop: 2,
  },
  tagsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
