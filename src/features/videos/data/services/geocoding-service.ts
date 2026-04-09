export class GeocodingService {
  private cache = new Map<string, { city: string | null; country: string | null }>();
  private queue: (() => Promise<void>)[] = [];
  private isProcessing = false;

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        // Rate limit: Nominatim requires max 1 req/sec
        await this.delay(1100);
      }
    }

    this.isProcessing = false;
  }

  private enqueueTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
      this.processQueue();
    });
  }

  async getCityAndCountry(lat: number, lon: number): Promise<{ city: string | null; country: string | null }> {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    return this.enqueueTask(async () => {
      // Check cache again in case another task fetched it
      if (this.cache.has(key)) {
        return this.cache.get(key)!;
      }

      let attempt = 0;
      const maxRetries = 3;
      
      while (attempt < maxRetries) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
            headers: {
              'User-Agent': 'dev.elainedb.rn_gemini/1.0'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();
          const result = {
            city: data.address?.city || data.address?.town || data.address?.village || null,
            country: data.address?.country || null,
          };

          this.cache.set(key, result);
          return result;
        } catch (e) {
          attempt++;
          if (attempt >= maxRetries) {
            return { city: null, country: null }; // Fallback
          }
          await this.delay(1000 * Math.pow(2, attempt - 1)); // Exponential backoff
        }
      }
      
      return { city: null, country: null };
    });
  }
}
