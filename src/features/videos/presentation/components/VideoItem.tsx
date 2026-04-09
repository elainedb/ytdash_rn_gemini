import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Video } from '../../domain/entities/video';

interface VideoItemProps {
  video: Video;
}

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const openVideo = async (videoId: string) => {
  const isIOS = Platform.OS === 'ios';
  const appUrl = isIOS ? `youtube://watch?v=${videoId}` : `vnd.youtube:${videoId}`;
  const altAppUrl = `youtube://watch?v=${videoId}`;
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

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

export const VideoItem: React.FC<VideoItemProps> = ({ video }) => {
  const hasLocation = video.city != null || video.country != null;
  const locationText = [video.city, video.country].filter(Boolean).join(', ');
  const hasCoordinates = video.latitude != null && video.longitude != null;
  
  return (
    <TouchableOpacity style={styles.container} onPress={() => openVideo(video.id)}>
      <Image
        style={styles.thumbnail}
        source={{ uri: video.thumbnailUrl }}
        placeholder={{ blurhash }}
        contentFit="cover"
        transition={1000}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channel} numberOfLines={1}>{video.channelName}</Text>
        
        <View style={styles.datesRow}>
          <Text style={styles.dateText}>Pub: {new Date(video.publishedAt).toISOString().split('T')[0]}</Text>
          {video.recordingDate && (
            <Text style={styles.dateText}>Rec: {new Date(video.recordingDate).toISOString().split('T')[0]}</Text>
          )}
        </View>
        
        {(hasLocation || hasCoordinates) && (
          <Text style={styles.location} numberOfLines={1}>
            📍 {hasLocation ? locationText : ''} {hasCoordinates ? `(${video.latitude?.toFixed(2)}, ${video.longitude?.toFixed(2)})` : ''}
          </Text>
        )}
        
        {video.tags && video.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {video.tags.slice(0, 5).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {video.tags.length > 5 && (
              <Text style={styles.moreTagsText}>+{video.tags.length - 5} more</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e1e4e8',
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
  channel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  location: {
    fontSize: 12,
    color: '#444',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#333',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
});
