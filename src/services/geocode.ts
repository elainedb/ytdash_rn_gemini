import { VideoLocation } from './api';

// Static instant lookup for the 5 mock locations to ensure fast, reliable local test execution
const STATIC_GEOCODE_LOOKUP: Record<string, string> = {
  '48.857,2.352': 'Paris, France',
  '51.507,-0.128': 'London, United Kingdom',
  '52.520,13.405': 'Berlin, Germany',
  '40.417,-3.704': 'Madrid, Spain',
  '41.903,12.496': 'Rome, Italy'
};

const geocodeCache = new Map<string, string>();

/**
 * Returns a key rounded to 3 decimal places for coordinate mapping
 */
function getCoordKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

/**
 * Performs reverse geocoding to resolve coordinate locations to place names.
 * Uses a static lookup for mock coordinates and Nominatim API fallback for real/unknown coordinates.
 */
export async function reverseGeocode(location: VideoLocation): Promise<string> {
  const key = getCoordKey(location.lat, location.lng);
  
  // 1. Check local static dictionary first
  if (STATIC_GEOCODE_LOOKUP[key]) {
    return STATIC_GEOCODE_LOOKUP[key];
  }
  
  // 2. Check dynamic in-memory cache
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key)!;
  }
  
  // 3. Fallback to Nominatim OSM Reverse Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json`;
    console.log(`[Geocode] Fetching reverse geocode from Nominatim for: ${location.lat}, ${location.lng}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ytdash_rn/1.0.0 (com.example.ytdash_rn)',
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const name = data.display_name || data.address?.city || data.address?.town || data.address?.country || 'Unknown Location';
      // Clean up the name for a shorter, cleaner presentation (e.g. city, country)
      const parts = name.split(',');
      const shortName = parts.length > 2 ? `${parts[0].trim()}, ${parts[parts.length - 1].trim()}` : name;
      
      geocodeCache.set(key, shortName);
      return shortName;
    }
  } catch (error) {
    console.error('[Geocode] Error performing reverse geocode:', error);
  }
  
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
}
