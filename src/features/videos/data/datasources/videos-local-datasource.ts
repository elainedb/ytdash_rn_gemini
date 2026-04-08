import * as SQLite from 'expo-sqlite';
import { VideoModel } from '../models/video-model';
import { CacheException } from '../../../../core/error/exceptions';

export interface VideosLocalDataSource {
  getCachedVideos(): Promise<VideoModel[]>;
  cacheVideos(videos: VideoModel[]): Promise<void>;
  isCacheValid(maxAge?: number): Promise<boolean>;
  getVideosByChannel(channelName: string): Promise<VideoModel[]>;
  getVideosByCountry(country: string): Promise<VideoModel[]>;
  getVideosWithLocation(): Promise<VideoModel[]>;
  clearCache(): Promise<void>;
}

export class VideosLocalDataSourceImpl implements VideosLocalDataSource {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('videos.db');
    this.initDb();
  }

  private initDb() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        channel_name TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        published_at TEXT NOT NULL,
        tags TEXT NOT NULL,
        city TEXT,
        country TEXT,
        latitude REAL,
        longitude REAL,
        recording_date TEXT,
        cached_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_channel_name ON videos (channel_name);
      CREATE INDEX IF NOT EXISTS idx_country ON videos (country);
      CREATE INDEX IF NOT EXISTS idx_published_at ON videos (published_at);
      CREATE INDEX IF NOT EXISTS idx_cached_at ON videos (cached_at);
    `);
  }

  private mapRowToModel(row: any): VideoModel {
    return new VideoModel(
      row.id,
      row.title,
      row.channel_name,
      row.thumbnail_url,
      row.published_at,
      JSON.parse(row.tags),
      row.city,
      row.country,
      row.latitude,
      row.longitude,
      row.recording_date
    );
  }

  async getCachedVideos(): Promise<VideoModel[]> {
    try {
      const rows = this.db.getAllSync('SELECT * FROM videos ORDER BY published_at DESC');
      return rows.map(this.mapRowToModel);
    } catch (error) {
      throw new CacheException('Failed to get cached videos');
    }
  }

  async cacheVideos(videos: VideoModel[]): Promise<void> {
    try {
      const now = Date.now();
      
      this.db.withTransactionSync(() => {
        this.db.runSync('DELETE FROM videos');
        
        const statement = this.db.prepareSync(`
          INSERT INTO videos (id, title, channel_name, thumbnail_url, published_at, tags, city, country, latitude, longitude, recording_date, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const video of videos) {
          statement.executeSync([
            video.id,
            video.title,
            video.channelName,
            video.thumbnailUrl,
            video.publishedAt,
            JSON.stringify(video.tags),
            video.city,
            video.country,
            video.latitude,
            video.longitude,
            video.recordingDate,
            now
          ]);
        }
        statement.finalizeSync();
      });
    } catch (error) {
      throw new CacheException('Failed to cache videos');
    }
  }

  async isCacheValid(maxAge: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      const result = this.db.getFirstSync<{ cached_at: number }>('SELECT cached_at FROM videos LIMIT 1');
      if (!result) return false;
      
      const now = Date.now();
      return (now - result.cached_at) < maxAge;
    } catch (error) {
      throw new CacheException('Failed to check cache validity');
    }
  }

  async getVideosByChannel(channelName: string): Promise<VideoModel[]> {
    try {
      const rows = this.db.getAllSync('SELECT * FROM videos WHERE channel_name = ? ORDER BY published_at DESC', [channelName]);
      return rows.map(this.mapRowToModel);
    } catch (error) {
      throw new CacheException('Failed to get videos by channel');
    }
  }

  async getVideosByCountry(country: string): Promise<VideoModel[]> {
    try {
      const rows = this.db.getAllSync('SELECT * FROM videos WHERE country = ? ORDER BY published_at DESC', [country]);
      return rows.map(this.mapRowToModel);
    } catch (error) {
      throw new CacheException('Failed to get videos by country');
    }
  }

  async getVideosWithLocation(): Promise<VideoModel[]> {
    try {
      const rows = this.db.getAllSync('SELECT * FROM videos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY published_at DESC');
      return rows.map(this.mapRowToModel);
    } catch (error) {
      throw new CacheException('Failed to get videos with location');
    }
  }

  async clearCache(): Promise<void> {
    try {
      this.db.runSync('DELETE FROM videos');
    } catch (error) {
      throw new CacheException('Failed to clear cache');
    }
  }
}
