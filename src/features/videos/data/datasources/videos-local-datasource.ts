import * as SQLite from 'expo-sqlite';
import { VideoModel } from '../models/video-model';

export interface VideosLocalDataSource {
  getCachedVideos(): Promise<VideoModel[]>;
  cacheVideos(videos: VideoModel[]): Promise<void>;
  isCacheValid(maxAge?: number): Promise<boolean>;
  getVideosByChannel(channelName: string): Promise<VideoModel[]>;
  getVideosByCountry(country: string): Promise<VideoModel[]>;
  getVideosWithLocation(): Promise<VideoModel[]>;
  clearCache(): Promise<void>;
}

const escapeSql = (val: string) => val.replace(/'/g, "''");

export class VideosLocalDataSourceImpl implements VideosLocalDataSource {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('videos.db');
      await this.db.execAsync(`
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
    }
    return this.db;
  }

  private rowToModel(row: any): VideoModel {
    return {
      id: row.id,
      title: row.title,
      channelName: row.channel_name,
      thumbnailUrl: row.thumbnail_url,
      publishedAt: row.published_at,
      tags: row.tags ? JSON.parse(row.tags) : [],
      city: row.city,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      recordingDate: row.recording_date,
    };
  }

  async getCachedVideos(): Promise<VideoModel[]> {
    const db = await this.init();
    const rows = await db.getAllAsync('SELECT * FROM videos ORDER BY published_at DESC');
    return rows.map(this.rowToModel);
  }

  async cacheVideos(videos: VideoModel[]): Promise<void> {
    const db = await this.init();
    const cachedAt = Date.now();

    await db.execAsync('DELETE FROM videos;');

    if (videos.length === 0) return;

    let sql = 'INSERT INTO videos (id, title, channel_name, thumbnail_url, published_at, tags, city, country, latitude, longitude, recording_date, cached_at) VALUES ';
    
    const values = videos.map(v => {
      const id = `'${escapeSql(v.id)}'`;
      const title = `'${escapeSql(v.title)}'`;
      const channel_name = `'${escapeSql(v.channelName)}'`;
      const thumbnail_url = `'${escapeSql(v.thumbnailUrl)}'`;
      const published_at = `'${escapeSql(v.publishedAt)}'`;
      const tags = `'${escapeSql(JSON.stringify(v.tags))}'`;
      const city = v.city ? `'${escapeSql(v.city)}'` : 'NULL';
      const country = v.country ? `'${escapeSql(v.country)}'` : 'NULL';
      const latitude = v.latitude !== null ? v.latitude : 'NULL';
      const longitude = v.longitude !== null ? v.longitude : 'NULL';
      const recording_date = v.recordingDate ? `'${escapeSql(v.recordingDate)}'` : 'NULL';
      
      return `(${id}, ${title}, ${channel_name}, ${thumbnail_url}, ${published_at}, ${tags}, ${city}, ${country}, ${latitude}, ${longitude}, ${recording_date}, ${cachedAt})`;
    });

    sql += values.join(', ') + ';';

    await db.execAsync(sql);
  }

  async isCacheValid(maxAge: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    const db = await this.init();
    const row: any = await db.getFirstAsync('SELECT MAX(cached_at) as last_cache FROM videos');
    if (!row || !row.last_cache) return false;
    
    return Date.now() - row.last_cache < maxAge;
  }

  async getVideosByChannel(channelName: string): Promise<VideoModel[]> {
    const db = await this.init();
    const rows = await db.getAllAsync('SELECT * FROM videos WHERE channel_name = ? ORDER BY published_at DESC', [channelName]);
    return rows.map(this.rowToModel);
  }

  async getVideosByCountry(country: string): Promise<VideoModel[]> {
    const db = await this.init();
    const rows = await db.getAllAsync('SELECT * FROM videos WHERE country = ? ORDER BY published_at DESC', [country]);
    return rows.map(this.rowToModel);
  }

  async getVideosWithLocation(): Promise<VideoModel[]> {
    const db = await this.init();
    const rows = await db.getAllAsync('SELECT * FROM videos WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY published_at DESC');
    return rows.map(this.rowToModel);
  }

  async clearCache(): Promise<void> {
    const db = await this.init();
    await db.execAsync('DELETE FROM videos;');
  }
}
