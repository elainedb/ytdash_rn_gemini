import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { VideoData } from '../services/youtubeApi';

interface VideoItemProps {
  video: VideoData;
}

const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const openVideo = async () => {
    const youtubeAppUrl = Platform.OS === 'android' ? `vnd.youtube:${video.id}` : `youtube://watch?v=${video.id}`;
    const fallbackUrl = `https://www.youtube.com/watch?v=${video.id}`;

    try {
      const supported = await Linking.canOpenURL(youtubeAppUrl);
      if (supported) {
        await Linking.openURL(youtubeAppUrl);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch {
      Alert.alert('Error', 'Could not open YouTube. Please make sure the app is installed.', [
        { text: 'Open in Browser', onPress: () => Linking.openURL(fallbackUrl) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={openVideo}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.channelName} numberOfLines={1}>
          {video.channelName}
        </Text>
        <Text style={styles.date}>Published: {video.publishedAt}</Text>
        {video.recordingDate && <Text style={styles.date}>Recorded: {video.recordingDate}</Text>}
        {video.location && (video.location.city || video.location.country) && (
          <Text style={styles.location}>
            📍 {video.location.city ? `${video.location.city}, ` : ''}
            {video.location.country}
          </Text>
        )}
        {video.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {video.tags.slice(0, 5).join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
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
    color: '#4285F4',
    marginTop: 2,
  },
  tags: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 2,
  },
});

export default VideoItem;
