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
  private getDb() {
    return SQLite.openDatabaseSync('videos.db');
  }

  async initDb(): Promise<void> {
    const db = this.getDb();
    try {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          title TEXT,
          channel_name TEXT,
          thumbnail_url TEXT,
          published_at TEXT,
          tags TEXT,
          city TEXT,
          country TEXT,
          latitude REAL,
          longitude REAL,
          recording_date TEXT,
          cached_at INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_channel_name ON videos(channel_name);
        CREATE INDEX IF NOT EXISTS idx_country ON videos(country);
        CREATE INDEX IF NOT EXISTS idx_published_at ON videos(published_at);
        CREATE INDEX IF NOT EXISTS idx_cached_at ON videos(cached_at);
      `);
    } catch (error) {
      console.error("Init DB Error", error);
    }
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

  private escapeSql(str: string): string {
    return str.replace(/'/g, "''");
  }

  async getCachedVideos(): Promise<VideoModel[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync('SELECT * FROM videos ORDER BY published_at DESC', []);
      return rows.map(this.mapRowToModel);
    } catch (e: any) {
      throw new CacheException(e.message || 'Failed to get cached videos');
    }
  }

  async cacheVideos(videos: VideoModel[]): Promise<void> {
    try {
      const db = this.getDb();
      const now = Date.now();
      
      if (videos.length === 0) {
        await db.execAsync('DELETE FROM videos');
        return;
      }

      const valueStrings = videos.map(v => {
        const id = `'${this.escapeSql(v.id)}'`;
        const title = `'${this.escapeSql(v.title)}'`;
        const channelName = `'${this.escapeSql(v.channelName)}'`;
        const thumbnailUrl = `'${this.escapeSql(v.thumbnailUrl)}'`;
        const publishedAt = `'${this.escapeSql(v.publishedAt)}'`;
        const tags = `'${this.escapeSql(JSON.stringify(v.tags))}'`;
        const city = v.city ? `'${this.escapeSql(v.city)}'` : 'NULL';
        const country = v.country ? `'${this.escapeSql(v.country)}'` : 'NULL';
        const latitude = v.latitude !== null ? v.latitude : 'NULL';
        const longitude = v.longitude !== null ? v.longitude : 'NULL';
        const recordingDate = v.recordingDate ? `'${this.escapeSql(v.recordingDate)}'` : 'NULL';
        
        return `(${id}, ${title}, ${channelName}, ${thumbnailUrl}, ${publishedAt}, ${tags}, ${city}, ${country}, ${latitude}, ${longitude}, ${recordingDate}, ${now})`;
      });

      const sql = `
        DELETE FROM videos;
        INSERT INTO videos (id, title, channel_name, thumbnail_url, published_at, tags, city, country, latitude, longitude, recording_date, cached_at)
        VALUES ${valueStrings.join(', ')};
      `;

      await db.execAsync(sql);
    } catch (e: any) {
      throw new CacheException(e.message || 'Failed to cache videos');
    }
  }

  async isCacheValid(maxAge: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      const db = this.getDb();
      const row = await db.getFirstAsync<{ cached_at: number }>('SELECT cached_at FROM videos LIMIT 1', []);
      if (!row) return false;
      
      return (Date.now() - row.cached_at) < maxAge;
    } catch (e) {
      return false;
    }
  }

  async getVideosByChannel(channelName: string): Promise<VideoModel[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync('SELECT * FROM videos WHERE channel_name = ? ORDER BY published_at DESC', [channelName]);
      return rows.map(this.mapRowToModel);
    } catch (e: any) {
      throw new CacheException(e.message || 'Failed to get videos by channel');
    }
  }

  async getVideosByCountry(country: string): Promise<VideoModel[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync('SELECT * FROM videos WHERE country = ? ORDER BY published_at DESC', [country]);
      return rows.map(this.mapRowToModel);
    } catch (e: any) {
      throw new CacheException(e.message || 'Failed to get videos by country');
    }
  }

  async getVideosWithLocation(): Promise<VideoModel[]> {
    try {
      const db = this.getDb();
      const rows = await db.getAllAsync('SELECT * FROM videos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY published_at DESC', []);
      return rows.map(this.mapRowToModel);
    } catch (e: any) {
      throw new CacheException(e.message || 'Failed to get videos with location');
    }
  }

  async clearCache(): Promise<void> {
    try {
      const db = this.getDb();
      await db.execAsync('DELETE FROM videos');
    } catch (e: any) {
      throw new CacheException(e.message || 'Failed to clear cache');
    }
  }
}
