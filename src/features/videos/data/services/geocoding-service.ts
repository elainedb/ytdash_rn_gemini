export interface GeocodingResult {
  city: string | null;
  country: string | null;
}

export class GeocodingService {
  private cache: Map<string, GeocodingResult> = new Map();
  private lastRequestTime: number = 0;
  private readonly RATE_LIMIT_MS = 1000;
  private queue: Promise<any> = Promise.resolve();

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await this.delay(this.RATE_LIMIT_MS - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();
  }

  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(3)},${lon.toFixed(3)}`;
  }

  private extractFallbackLocation(locationDescription: string | null): GeocodingResult {
    if (!locationDescription) {
      return { city: null, country: null };
    }
    // Attempt to parse "City, Country" or similar format from description
    const parts = locationDescription.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return { city: parts[0], country: parts[1] };
    }
    return { city: parts[0] || null, country: null };
  }

  private async fetchGeocoding(lat: number, lon: number): Promise<GeocodingResult> {
    let attempt = 0;
    const maxAttempts = 4; // Initial + 3 retries
    const backoffs = [0, 1000, 2000, 4000];

    while (attempt < maxAttempts) {
      try {
        await this.enforceRateLimit();

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'dev.elainedb.rn_claude/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();
        
        let city = data.address?.city || data.address?.town || data.address?.village || null;
        let country = data.address?.country || null;
        
        return { city, country };
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        const waitTime = Math.max(backoffs[attempt], this.RATE_LIMIT_MS);
        await this.delay(waitTime);
      }
    }
    
    throw new Error('Geocoding failed after retries');
  }

  async reverseGeocode(lat: number, lon: number, fallbackDescription: string | null): Promise<GeocodingResult> {
    const cacheKey = this.getCacheKey(lat, lon);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    return new Promise((resolve) => {
      this.queue = this.queue.then(async () => {
        try {
          const result = await this.fetchGeocoding(lat, lon);
          this.cache.set(cacheKey, result);
          resolve(result);
        } catch (error) {
          console.warn('Geocoding failed, using fallback.', error);
          const fallback = this.extractFallbackLocation(fallbackDescription);
          this.cache.set(cacheKey, fallback);
          resolve(fallback);
        }
      });
    });
  }
}
