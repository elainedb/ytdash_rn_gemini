export interface Video {
  readonly id: string;
  readonly title: string;
  readonly channelName: string;
  readonly thumbnailUrl: string;
  readonly publishedAt: Date;
  readonly tags: readonly string[];
  readonly city: string | null;
  readonly country: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly recordingDate: Date | null;
}

export function hasLocation(video: Video): boolean {
  return video.city !== null || video.country !== null;
}

export function hasCoordinates(video: Video): boolean {
  return video.latitude !== null && video.longitude !== null;
}

export function hasRecordingDate(video: Video): boolean {
  return video.recordingDate !== null;
}

export function locationText(video: Video): string {
  if (video.city && video.country) {
    return `${video.city}, ${video.country}`;
  }
  if (video.city) {
    return video.city;
  }
  if (video.country) {
    return video.country;
  }
  return 'Unknown Location';
}
