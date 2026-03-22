import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { VideoData } from '@/services/cacheService';

interface VideoItemProps {
  video: VideoData;
}

export default function VideoItem({ video }: VideoItemProps) {
  const handlePress = async () => {
    const youtubeAppUrlIos = `youtube://watch?v=${video.id}`;
    const youtubeAppUrlAndroid = `vnd.youtube:${video.id}`;
    const fallbackUrl = `https://www.youtube.com/watch?v=${video.id}`;

    try {
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL(youtubeAppUrlIos);
        if (canOpen) {
          await Linking.openURL(youtubeAppUrlIos);
        } else {
          await Linking.openURL(fallbackUrl);
        }
      } else {
        const canOpen = await Linking.canOpenURL(youtubeAppUrlAndroid);
        if (canOpen) {
          await Linking.openURL(youtubeAppUrlAndroid);
        } else {
          await Linking.openURL(fallbackUrl);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open video. Suggest installing the YouTube app.');
    }
  };

  const displayLocation = () => {
    if (!video.location) return null;
    const { city, country } = video.location;
    if (city && country) return `📍 ${city}, ${country}`;
    if (city) return `📍 ${city}`;
    if (country) return `📍 ${country}`;
    return null;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channel} numberOfLines={1}>{video.channelName}</Text>
        <Text style={styles.date}>Published: {video.publishedAt}</Text>
        {video.recordingDate && <Text style={styles.date}>Recorded: {video.recordingDate}</Text>}
        {displayLocation() && <Text style={styles.location}>{displayLocation()}</Text>}
        {video.tags && video.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {video.tags.slice(0, 5).join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
  info: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'flex-start',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  channel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: '#888',
  },
  location: {
    fontSize: 11,
    color: '#444',
    marginTop: 2,
  },
  tags: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 4,
  },
});
