# SPEC.md

This specification describes a React Native mobile application that authenticates users via Google Sign-In and displays YouTube videos from specific channels with filtering, sorting, caching, and a map view. The app is built incrementally across four versions.

## Tech Stack

- **Framework**: Expo SDK 54 with React Native 0.81, React 19
- **Language**: TypeScript (strict mode)
- **Routing**: Expo Router (file-based routing in `app/` directory) with stack navigation
- **State management**: React hooks (useState, useEffect) — no external state library
- **Styling**: React Native StyleSheet (no styled-components or NativeWind)
- **Testing**: Jest with ts-jest and @testing-library/react-native
- **New Architecture**: Enabled (Fabric renderer)
- **React Compiler**: Enabled

## Configuration

The app uses two gitignored configuration files that must be created manually:

### `config.json`
```json
{
  "youtubeApiKey": "YOUR_YOUTUBE_API_KEY",
  "authorizedEmails": [
    "user1@example.com",
    "user2@example.com"
  ]
}
```

### `config.js`
```js
export const youtubeApiKey = "YOUR_YOUTUBE_API_KEY";
```

The YouTube API key is imported from `config.js` in the API service. The authorized emails list is imported from `config.json` in the login screen, with a hardcoded fallback array if the file is missing.

### `google-services.json`
Standard Firebase/Google Sign-In configuration file for Android, placed at the project root (gitignored).

### `app.json`
- Package identifiers: `dev.elainedb.rn-gemini` (iOS), `dev.elainedb.rn_gemini` (Android)
- Orientation: portrait
- URL scheme: `rngemini`

---

## Version 1 — Google Sign-In

### Screen: Login (`app/login.tsx`)

**UI:**
- Title text: "Login with Google"
- A "Sign in with Google" button (blue `#4285F4` background, white text)
- Error message text below the button (red `#d32f2f`), shown conditionally
- Debug info text at the bottom showing package name and config status
- Loading state: button shows `ActivityIndicator` and is disabled while sign-in is in progress

**Logic:**
- Uses `@react-native-google-signin/google-signin` library
- Configures GoogleSignin on mount with scopes `['openid', 'profile', 'email']`, no `webClientId` (relies on Android client from `google-services.json`)
- On mount, checks if user is already signed in and logs status
- Sign-in flow:
  1. Checks Play Services availability (non-blocking if check fails)
  2. Calls `GoogleSignin.signIn()`
  3. Extracts email from `userInfo.data?.user?.email` or `userInfo.user?.email`
  4. If email is in `authorizedEmails` list: navigates to `/main` using `router.replace`
  5. If email is not authorized: shows "Access denied" error and signs the user out
- Error handling covers: sign-in cancelled, already in progress, Play Services unavailable, and unknown errors

---

## Version 2 — YouTube Video List

### Screen: Main (`app/main.tsx`)

**UI:**
- `SafeAreaView` with `StatusBar` configured for Android padding
- Header row with "YouTube Videos" title and a red Logout button
- Video list using `FlatList` with `VideoItem` components
- Loading state: centered `ActivityIndicator` with "Loading videos..." text
- Empty state: message with suggestion to pull-to-refresh or check API key

**Logic:**
- On mount, calls `fetchAllVideos()` from the YouTube API service
- Videos sorted by publication date (newest first) by default
- Tapping a video item opens it in the YouTube app (platform-specific deep links) or falls back to browser via `Linking`
- Logout flow: confirmation `Alert`, then `GoogleSignin.signOut()`, then `router.replace('/login')`

### Service: YouTube API (`services/youtubeApi.ts`)

**Data model:**
```typescript
interface VideoData {
  id: string;
  title: string;
  channelName: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  recordingDate?: string;
}
```

**Channels** (hardcoded):
```
UCynoa1DjwnvHAowA_jiMEAQ
UCK0KOjX3beyB9nzonls0cuw
UCACkIrvrGAQ7kuc0hMVwvmA
UCtWRAKKvOEA0CXOue9BG8ZA
```

**Fetching logic:**
1. For each channel, calls YouTube Data API v3 `search` endpoint (`part=snippet`, `order=date`, `maxResults=50`, `type=video`)
2. Collects all video IDs from search results
3. Calls `videos` endpoint (`part=snippet,recordingDetails,localizations`) with those IDs to get detailed metadata
4. Combines search and detail results by video ID
5. Extracts: title, channelTitle, publishedAt, thumbnail (medium or default), tags, recordingDate, and location from `recordingDetails`
6. All channels fetched in parallel with `Promise.all`
7. Results merged into a single array and sorted by publication date (newest first)

**Location extraction:**
- Primary source: `recordingDetails.location` (latitude, longitude)
- If coordinates exist but city/country are missing: reverse geocodes via OpenStreetMap Nominatim API (`nominatim.openstreetmap.org/reverse`) with 1-second rate limiting and `User-Agent: YouTube-Video-App/1.0`
- Fallback: parses `snippet.locationDescription` using regex for "City, Country" patterns
- Dates formatted as `YYYY-MM-DD` using `toISOString().split('T')[0]`

### Component: VideoItem (`components/VideoItem.tsx`)

Card layout with:
- Left: thumbnail image (120x90, rounded corners)
- Right: title (2-line max), channel name (1-line), publication date, recording date (if available), location with pin emoji (if available), tags (first 5, comma-separated, italic)
- Tapping opens video: tries YouTube app deep link first (`youtube://` on iOS, `vnd.youtube:` on Android), then alternative Android URL, then web browser fallback
- Error alert suggests installing the YouTube app

---

## Version 3 — Caching, Filters, and Sort

### Cache Service (`services/cacheService.ts`)

- Uses `@react-native-async-storage/async-storage`
- Cache key: `youtube_videos_cache`
- Stores `{ videos: VideoData[], timestamp: number }`
- Expiration: 24 hours
- Methods: `saveToCache`, `getFromCache` (returns null if expired), `clearCache`, `isCacheValid`, `getCacheAge` (in minutes)
- `fetchAllVideos(forceRefresh)` checks cache first unless `forceRefresh` is true
- After loading from cache, runs `enhanceLocationData()` to reverse-geocode any videos with coordinates but missing city/country, then updates the cache

### Main Screen Additions

**Controls bar** (row of buttons below header):
- **Filter button**: opens FilterModal, shows "(Active)" label when filters are applied
- **Sort button**: opens SortModal, shows current sort field ("Published" or "Recorded")
- **Refresh button** (blue): force-refreshes from API, updates cache. Also available via pull-to-refresh (`RefreshControl`)
- **View Map button** (green): navigates to `/map`

**Stats line**: "Showing X of Y videos" below controls

**Filter logic:**
- Filters derived from loaded data: unique channel names and unique countries (sorted alphabetically)
- Both filters applied as AND conditions
- Filtering and sorting recompute via `useEffect` whenever `allVideos`, `filters`, or `sortOptions` change

### Component: FilterModal (`components/FilterModal.tsx`)

- Full-screen modal with slide animation (`presentationStyle="pageSheet"`)
- Two sections: "Source Channel" and "Country"
- Each section has an "All" option plus dynamically populated options from the video data
- Selected option highlighted in blue (`#4285F4`) with white text
- Footer with "Clear All" (resets both filters) and "Apply Filters" buttons
- Local state for selections, synced with parent on apply

### Component: SortModal (`components/SortModal.tsx`)

- Full-screen modal with slide animation
- "Sort By" section: Publication Date or Recording Date (with descriptions)
- "Order" section: Newest First or Oldest First (with descriptions)
- Preview section showing "Current Selection" summary
- Footer with "Apply Sort" button
- When sorting by recording date, videos without a recording date fall back to their publication date

---

## Version 4 — Map View

### Screen: Map (`app/map.tsx`)

**UI:**
- Header with back button ("< Back"), title "Video Locations", and spacer for alignment
- Full-screen map rendered via `react-native-webview` containing a Leaflet.js/OpenStreetMap map
- Custom video markers: blue circles with camera emoji (`#4285F4` background, white border, drop shadow)
- Bottom sheet (`@gorhom/bottom-sheet`) at 25% screen height, dismissible by swiping down
- Wrapped in `GestureHandlerRootView` for gesture support

**Map implementation:**
- HTML string with Leaflet.js loaded from CDN (`unpkg.com/leaflet@1.9.4`)
- Initial view centered at San Francisco (37.7749, -122.4194), zoom level 2
- OpenStreetMap tile layer with attribution
- Markers sent from React Native to WebView via `postMessage` after a 1-second delay
- Marker click sends `{ type: 'markerClick', videoId }` back to React Native via `ReactNativeWebView.postMessage`
- After all markers are added, map auto-fits bounds with 10% padding using `featureGroup.getBounds().pad(0.1)`
- WebView listens on both `document` and `window` message events (for iOS and Android compatibility)

**Bottom sheet content:**
- Thumbnail (80x60), title, channel name, publication date, recording date, location with pin emoji (city, country, coordinates to 6 decimal places), tags (first 5)
- "Watch on YouTube" button (red `#FF0000`): tries multiple URL schemes in order — `vnd.youtube://`, alternative YouTube format, mobile YouTube web, standard web URL — with fallback alert

**Data flow:**
- Loads all videos from cache via `fetchAllVideos()` (no force refresh)
- Filters to only videos with valid latitude and longitude
- Shows "No videos with location data found" with refresh button if none qualify

---

## Navigation Structure

File-based routing via Expo Router with stack navigation:

```
app/
  _layout.tsx    — Root Stack with ThemeProvider (light/dark), initialRouteName: 'login'
  index.tsx      — Redirect to /login
  login.tsx      — Google Sign-In screen
  main.tsx       — Video list with controls
  map.tsx        — Map view with markers
  modal.tsx      — Placeholder modal (unused)
```

All screens have `headerShown: false` (custom headers). Navigation uses `router.replace` for login/logout (no back) and `router.push`/`router.back` for main-to-map transitions.

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `@react-native-google-signin/google-signin` | Google authentication |
| `@react-native-async-storage/async-storage` | Local cache storage |
| `react-native-webview` | Map rendering (Leaflet.js in WebView) |
| `@gorhom/bottom-sheet` | Map screen video detail sheet |
| `react-native-gesture-handler` | Gesture support for bottom sheet |
| `react-native-reanimated` | Animations for bottom sheet |
| `expo-image` | Optimized image loading (map screen thumbnails) |
| `expo-router` | File-based navigation |

Note: The requirements suggested `react-native-maps` for the map, but the implementation uses `react-native-webview` with Leaflet.js/OpenStreetMap instead.
