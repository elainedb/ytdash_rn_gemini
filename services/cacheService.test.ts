import * as cacheService from './cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('cacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save to cache', async () => {
    const videos = [{ id: '1' }];
    await cacheService.saveToCache(videos);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'youtube_videos_cache',
      expect.stringContaining('"id":"1"')
    );
  });

  it('should get from cache', async () => {
    const timestamp = Date.now();
    const mockData = JSON.stringify({
      videos: [{ id: '1' }],
      timestamp: timestamp,
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockData);

    const result = await cacheService.getFromCache();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should return null if cache is expired', async () => {
    const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours
    const mockData = JSON.stringify({
      videos: [{ id: '1' }],
      timestamp: oldTimestamp,
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockData);

    const result = await cacheService.getFromCache();
    expect(result).toBeNull();
  });
});
