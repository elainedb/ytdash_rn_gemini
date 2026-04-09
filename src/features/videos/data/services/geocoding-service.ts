export class GeocodingService {
  private cache = new Map<string, { city: string | null; country: string | null }>();
  private queue: Promise<void> = Promise.resolve();

  async reverseGeocode(
    latitude: number,
    longitude: number,
    locationDescription?: string
  ): Promise<{ city: string | null; country: string | null }> {
    const latRounded = latitude.toFixed(3);
    const lonRounded = longitude.toFixed(3);
    const cacheKey = `${latRounded},${lonRounded}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const fetchTask = async () => {
      let attempts = 0;
      const backoffs = [1000, 2000, 4000];

      while (attempts < 4) {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'dev.elainedb.rn_gemini/1.0',
            },
          });

          if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status}`);
          }

          const data = await response.json();
          const address = data.address || {};
          const city = address.city || address.town || address.village || null;
          const country = address.country || null;

          const result = { city, country };
          this.cache.set(cacheKey, result);
          return result;
        } catch (error) {
          if (attempts < backoffs.length) {
            const delay = backoffs[attempts];
            await new Promise((resolve) => setTimeout(resolve, delay));
            attempts++;
          } else {
            break; // Failed after all retries
          }
        }
      }

      // Fallback
      return this.fallback(locationDescription);
    };

    return new Promise((resolve) => {
      this.queue = this.queue.then(async () => {
        // Enforce 1-second delay between requests
        await new Promise((res) => setTimeout(res, 1000));
        const result = await fetchTask();
        resolve(result);
      });
    });
  }

  private fallback(locationDescription?: string): { city: string | null; country: string | null } {
    if (!locationDescription) {
      return { city: null, country: null };
    }

    // Try to match "City, Country" or just single location
    const parts = locationDescription.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      return { city: parts[0], country: parts[parts.length - 1] };
    } else if (parts.length === 1) {
      return { city: parts[0], country: null };
    }

    return { city: null, country: null };
  }
}
