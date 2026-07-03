export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string; // matches the source channel's label
  thumbnailUrl: string;
  lat: number | null;
  lng: number | null;
  youtubeUrl: string;
}

export interface ChannelConfig {
  id: string;
  label: string;
}

export type ScreenType = 'login' | 'home' | 'map';

export interface AppState {
  userEmail: string | null;
  videos: Video[];
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string | null;
}
