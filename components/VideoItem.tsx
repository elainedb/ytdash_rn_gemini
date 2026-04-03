import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { VideoData } from '../services/youtubeApi';

interface VideoItemProps {
  video: VideoData;
}

export default function VideoItem({ video }: VideoItemProps) {
  const handlePress = async () => {
    const youtubeAppUrl = Platform.OS === 'ios' ? `youtube://${video.id}` : `vnd.youtube:${video.id}`;
    const altAndroidUrl = `intent://www.youtube.com/watch?v=${video.id}#Intent;package=com.google.android.youtube;scheme=https;end;`;
    const webUrl = video.videoUrl;

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

  const tagsDisplay = video.tags.slice(0, 5).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channelName} numberOfLines={1}>{video.channelName}</Text>
        <Text style={styles.date}>Pub: {video.publishedAt}</Text>
        {video.recordingDate && <Text style={styles.date}>Rec: {video.recordingDate}</Text>}
        {video.location && (
          <Text style={styles.location}>
            📍 {video.location.city ? `${video.location.city}, ` : ''}{video.location.country || ''}
            {!video.location.city && !video.location.country && video.location.latitude ? 'Unknown Location' : ''}
          </Text>
        )}
        {tagsDisplay ? <Text style={styles.tags} numberOfLines={1}>{tagsDisplay}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  channelName: {
    fontSize: 12,
    color: '#606060',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#606060',
  },
  location: {
    fontSize: 12,
    color: '#606060',
    marginTop: 2,
  },
  tags: {
    fontSize: 12,
    color: '#606060',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
