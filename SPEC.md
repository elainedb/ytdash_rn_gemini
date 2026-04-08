# SPEC.md

This specification describes the React Native YouTube Videos app. It is intended to be used by an AI Agent to build this project from scratch.

---

## 1. Project Overview

A React Native application (Expo) that authenticates users via Google Sign-In (with an email whitelist), displays YouTube videos from four specific channels, supports local caching with SQLite, filtering, sorting, and a map view showing video recording locations.

**Target platforms:** Android and iOS
**Framework:** Expo SDK 54, React Native 0.81, React 19
**Language:** TypeScript (strict mode)
**New Architecture:** Enabled (Fabric renderer)
**React Compiler:** Enabled

---

## 2. Architecture

The project follows **Clean Architecture** organized by feature under `src/features/`. Each feature has three layers:

- **Domain:** TypeScript interfaces for entities, abstract repository interfaces, and use cases. Use cases implement a common `UseCase<T, P>` base interface. All repository methods return `Result<T>` for type-safe error handling.
- **Data:** Repository implementations, remote data sources (API calls), local data sources (SQLite caching), and Zod schemas for runtime API response validation. Models have a `toEntity()` function to convert to domain entities.
- **Presentation:** Zustand stores for state management and React screen components.

### Project Structure

```
src/
  core/
    error/
      exceptions.ts       — Exception classes (ServerException, CacheException, etc.)
      failures.ts          — Failure type union
      result.ts            — Result<T> type definition
    usecases/
      usecase.ts           — UseCase base interface
    di/
      container.ts         — Dependency injection container
  features/
    authentication/
      domain/
        entities/user.ts
        repositories/auth-repository.ts
        usecases/sign-in-with-google.ts
        usecases/sign-out.ts
        usecases/get-current-user.ts
      data/
        models/user-model.ts
        datasources/auth-remote-datasource.ts
        repositories/auth-repository-impl.ts
      presentation/
        stores/auth-store.ts
    videos/
      domain/
        entities/video.ts
        repositories/videos-repository.ts
        usecases/get-videos.ts
        usecases/get-videos-by-channel.ts
        usecases/get-videos-by-country.ts
      data/
        models/video-model.ts
        datasources/videos-remote-datasource.ts
        datasources/videos-local-datasource.ts
        repositories/videos-repository-impl.ts
      presentation/
        stores/videos-store.ts
        components/VideoItem.tsx
        components/FilterModal.tsx
        components/SortModal.tsx
app/
  _layout.tsx
  index.tsx
  login.tsx
  main.tsx
  map.tsx
```

### Dependency Injection

A manual DI container in `src/core/di/container.ts` provides singleton instances of data sources, repositories, and use cases via factory functions. The container is initialized once at app startup and provides typed access to dependencies:

```typescript
interface Container {
  authRemoteDataSource: AuthRemoteDataSource;
  authRepository: AuthRepository;
  signInWithGoogle: SignInWithGoogle;
  signOut: SignOut;
  getCurrentUser: GetCurrentUser;
  videosRemoteDataSource: VideosRemoteDataSource;
  videosLocalDataSource: VideosLocalDataSource;
  videosRepository: VideosRepository;
  getVideos: GetVideos;
  getVideosByChannel: GetVideosByChannel;
  getVideosByCountry: GetVideosByCountry;
}
```

### Error Handling

- **Exceptions** (`src/core/error/exceptions.ts`): A base `AppException` class with subclasses `ServerException`, `CacheException`, `NetworkException`, and `AuthException`. Each carries a `message: string`.
- **Failures** (`src/core/error/failures.ts`): A discriminated union type:
  ```typescript
  type Failure =
    | { type: 'server'; message: string }
    | { type: 'cache'; message: string }
    | { type: 'network'; message: string }
    | { type: 'auth'; message: string }
    | { type: 'validation'; message: string }
    | { type: 'unexpected'; message: string };
  ```
- **Result type** (`src/core/error/result.ts`):
  ```typescript
  type Result<T> = { ok: true; data: T } | { ok: false; error: Failure };
  ```
- Data layer catches exceptions and returns `Result` with failure. Presentation layer maps failures to UI error messages.

### Use Case Base Interface

`src/core/usecases/usecase.ts` defines:
```typescript
interface UseCase<T, P> {
  execute(params: P): Promise<Result<T>>;
}
```
Use cases that take no parameters use `void` as the params type.

---

## 3. Configuration & Security

Sensitive configuration files are **gitignored** and must be created from templates before running.

### Required Config Files

1. **`src/config/auth-config.ts`** (from `auth-config.template.ts`):
   ```typescript
   export const authorizedEmails: string[] = [
     'your-email@example.com',
   ];
   ```

2. **`src/config/api-config.ts`** (from `api-config.template.ts`):
   ```typescript
   export const youtubeApiKey = 'YOUR_YOUTUBE_API_KEY_HERE';
   ```

3. **Firebase config files:**
   - `android/app/google-services.json`
   - `ios/GoogleService-Info.plist`

### CI Setup

A script `scripts/ensure-config.ts` generates safe placeholder config files (empty email list, placeholder API key) when the real files are missing, allowing analysis and tests to pass in CI.

### `app.json`
- Package identifiers: `dev.elainedb.rn-claude` (iOS), `dev.elainedb.rn_claude` (Android)
- Orientation: portrait
- URL scheme: `rnclaude`

---

## 4. App Initialization

`app/_layout.tsx` performs this startup sequence:
1. Initialize the DI container (`initContainer()`)
2. Set up the root `Stack` navigator via Expo Router with `initialRouteName: 'login'`
3. Wrap the root with a `ThemeProvider` (light/dark mode support)

All screens have `headerShown: false` (custom headers).

---

## 5. Feature: Authentication

**Location:** `src/features/authentication/`

### 5.1 Domain

**Entity — `User`:**
```typescript
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly photoUrl: string | null;
}
```

**Repository interface — `AuthRepository`:**
- `signInWithGoogle()` → `Promise<Result<User>>`
- `signOut()` → `Promise<Result<void>>`
- `getCurrentUser()` → `Promise<Result<User | null>>`

**Use cases:**
- `SignInWithGoogle` — calls `signInWithGoogle()`, takes `void`
- `SignOut` — calls `signOut()`, takes `void`
- `GetCurrentUser` — calls `getCurrentUser()`, takes `void`

### 5.2 Data

**Model — `UserModel`:**
- Zod schema for validation: `userModelSchema`
- Fields: `id`, `name`, `email`, `photoUrl`
- `toEntity()` → converts to `User`
- Factory `fromGoogleUser(userInfo)` → creates from Google Sign-In response

**Remote data source — `AuthRemoteDataSource`:**
- Uses `@react-native-google-signin/google-signin`
- `signInWithGoogle()`: Checks Play Services, triggers `GoogleSignin.signIn()`, returns `UserModel`
- `signOut()`: Calls `GoogleSignin.signOut()`
- `getCurrentUser()`: Returns `UserModel` from `GoogleSignin.getCurrentUser()` or `null`
- Configures GoogleSignIn on init with scopes `['openid', 'profile', 'email']`

**Repository — `AuthRepositoryImpl`:**
- `signInWithGoogle()`: Calls remote, then **validates the user's email** against `authorizedEmails`. If the email is not in the list, calls `signOut()` and returns `{ ok: false, error: { type: 'auth', message: 'Access denied. Your email is not authorized.' } }`.
- `signOut()`: Delegates to remote
- `getCurrentUser()`: Delegates to remote, also validates email if user exists

### 5.3 Presentation

**Store — `AuthStore` (Zustand):**

**State:**
```typescript
type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  errorMessage: string | null;
}
```

**Actions:**
- `checkAuthStatus()`: Calls `GetCurrentUser`. If user returned → `authenticated`. If null → `unauthenticated`.
- `signIn()`: Sets `loading`, calls `SignInWithGoogle`. Maps result to `authenticated` or `error`.
- `signOut()`: Calls `SignOut`, sets `unauthenticated`.

**Screens:**

- **`login.tsx`**: Reads auth store state. Displays "Login with Google" title, a "Sign in with Google" button (blue `#4285F4`), and an error message text (red `#d32f2f`) below the button when auth fails. Loading state: button shows `ActivityIndicator` and is disabled. On successful auth, navigates to `/main` via `router.replace`.

- **`index.tsx`**: Redirects to `/login` on mount. Checks auth status and routes to `/main` if already authenticated.

---

## 6. Feature: Videos

**Location:** `src/features/videos/`

### 6.1 Domain

**Entity — `Video`:**
```typescript
interface Video {
  readonly id: string;
  readonly title: string;
  readonly channelName: string;
  readonly thumbnailUrl: string;
  readonly publishedAt: Date;
  readonly tags: readonly string[];
  readonly city: string | null;
  readonly country: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly recordingDate: Date | null;
}
```

Utility getters (standalone functions or a helper module):
- `hasLocation(video)` → `city != null || country != null`
- `hasCoordinates(video)` → `latitude != null && longitude != null`
- `hasRecordingDate(video)` → `recordingDate != null`
- `locationText(video)` → formatted location string

**Repository interface — `VideosRepository`:**
- `getVideosFromChannels(channelIds: string[], forceRefresh?: boolean)` → `Promise<Result<Video[]>>`
- `getVideosByChannel(channelName: string)` → `Promise<Result<Video[]>>`
- `getVideosByCountry(country: string)` → `Promise<Result<Video[]>>`
- `clearCache()` → `Promise<Result<void>>`

**Use cases:**
- `GetVideos` — params: `{ channelIds: string[]; forceRefresh: boolean }`
- `GetVideosByChannel` — params: `{ channelName: string }`
- `GetVideosByCountry` — params: `{ country: string }`

### 6.2 Data

**Model — `VideoModel`:**

Zod schema `videoModelSchema` validates API responses at runtime. Fields mirror the entity plus string-typed dates (`publishedAt` as string, `recordingDate` as string or null). `toEntity()` parses date strings to `Date` objects.

**Remote data source — `VideosRemoteDataSource`:**
- `getVideosFromChannels(channelIds: string[])` → `Promise<VideoModel[]>`
- Implementation:
  1. For each channel ID, call YouTube Data API v3 `search` endpoint (`part=snippet`, `order=date`, `maxResults=50`, `type=video`). **Exhaustive pagination:** follow `nextPageToken` in a `while` loop until the API returns no `nextPageToken` (i.e., it is `undefined`/absent in the response), ensuring every video from every channel is fetched regardless of channel size. There is no artificial page limit — pagination continues until the API signals completion. All channels are fetched in parallel with `Promise.all`.
  2. Collect all video IDs from search results.
  3. Call YouTube Data API `videos` endpoint with `part=snippet,recordingDetails` to fetch detailed metadata (tags, location, recording date). Video IDs are batched in groups of 50 (API limit per request).
  4. Build `VideoModel` objects from the detailed data, validated through Zod schemas.
  5. For videos with GPS coordinates (`latitude`/`longitude`), perform **reverse geocoding** (see Reverse Geocoding section below).
  6. Results merged into a single array and sorted by `publishedAt` descending.
- YouTube API key is read from `api-config.ts`.

**Reverse Geocoding (`GeocodingService` in `src/features/videos/data/services/geocoding-service.ts`):**
- Converts GPS coordinates to city/country names using the OpenStreetMap Nominatim API (`nominatim.openstreetmap.org/reverse`).
- **User-Agent identification:** All Nominatim requests include a unique `User-Agent` header (`dev.elainedb.rn_claude/1.0`). This is mandatory per Nominatim usage policy — requests without proper identification are rejected.
- **In-memory cache:** A `Map<string, { city: string | null; country: string | null }>` caches resolved coordinates. Cache keys are coordinates rounded to 3 decimal places (~111m precision) to group nearby points and avoid redundant lookups.
- **Rate limiting:** Nominatim requires a maximum of 1 request per second. Requests are serialized through an async queue that enforces a minimum 1-second delay between consecutive API calls. Requests are never made in parallel.
- **Retry with backoff:** Failed lookups (network errors, 5xx responses) retry up to 3 times with exponential backoff (1s, 2s, 4s — respecting the 1-second minimum) before falling back.
- **Fallback chain:** If Nominatim fails after retries, falls back to parsing `locationDescription` from the YouTube API snippet using regex for "City, Country" patterns. If no `locationDescription` is available, the city/country fields remain `null`.
- **Batch processing:** Videos are geocoded in sequence (due to Nominatim's rate limit) during the API fetch phase. Already-cached coordinates are resolved instantly from the in-memory cache; only uncached coordinates trigger Nominatim requests.
- **Persistent cache:** On each successful geocoding run, the resolved location data is persisted to the SQLite database alongside the video data. Subsequent loads from cache include the city/country without re-geocoding.

**Local data source — `VideosLocalDataSource`** (SQLite via `expo-sqlite`):
- Database: `videos.db` with a single `videos` table.
- Schema columns: `id` (TEXT PK), `title`, `channel_name`, `thumbnail_url`, `published_at`, `tags` (JSON-encoded string), `city`, `country`, `latitude` (REAL), `longitude` (REAL), `recording_date`, `cached_at`.
- Indexes on: `channel_name`, `country`, `published_at`, `cached_at`.
- Methods:
  - `getCachedVideos()` — returns all videos ordered by `published_at DESC`
  - `cacheVideos(videos: VideoModel[])` — clears table, inserts all videos with current timestamp as `cached_at` (batch transaction)
  - `isCacheValid(maxAge: number = 24 * 60 * 60 * 1000)` — checks if most recent `cached_at` is within `maxAge` ms
  - `getVideosByChannel(channelName: string)` — queries by `channel_name`
  - `getVideosByCountry(country: string)` — queries by `country`
  - `getVideosWithLocation()` — returns videos with non-null latitude and longitude
  - `clearCache()` — deletes all rows

**Repository — `VideosRepositoryImpl`:**
- `getVideosFromChannels()`:
  1. If `forceRefresh` is false and cache is valid (< 24 hours) and non-empty → return cached data converted to entities.
  2. Otherwise fetch from remote, cache results, return entities.
  3. If remote call throws `ServerException` → attempt to return cached data as fallback. If cache also fails → return `{ ok: false, error: { type: 'server', message: ... } }`.
- `getVideosByChannel()` and `getVideosByCountry()` read from local cache only.
- `clearCache()` delegates to local data source.

### 6.3 Presentation

**Store — `VideosStore` (Zustand):**

Hardcoded channel IDs:
```typescript
const CHANNEL_IDS = [
  'UCynoa1DjwnvHAowA_jiMEAQ',
  'UCK0KOjX3beyB9nzonls0cuw',
  'UCACkIrvrGAQ7kuc0hMVwvmA',
  'UCtWRAKKvOEA0CXOue9BG8ZA',
];
```

**State:**
```typescript
type VideosStatus = 'initial' | 'loading' | 'loaded' | 'error';

interface SortOptions {
  sortBy: 'publishedDate' | 'recordingDate';
  sortOrder: 'ascending' | 'descending';
}

interface FilterOptions {
  channelName: string | null;
  country: string | null;
}

interface VideosState {
  status: VideosStatus;
  allVideos: Video[];
  filteredVideos: Video[];
  filters: FilterOptions;
  sortOptions: SortOptions;
  isRefreshing: boolean;
  errorMessage: string | null;
}
```

**Actions:**
- `loadVideos()` — initial load, calls `GetVideos` use case
- `refreshVideos()` — force refresh from API, preserves current filter/sort state
- `filterByChannel(channelName: string | null)` — null clears the filter
- `filterByCountry(country: string | null)` — null clears the filter
- `sortVideos(sortBy, sortOrder)` — applies sort
- `clearFilters()` — resets to no filters, publishedDate descending

**Key logic:**
- `applyFiltersAndSort()` applies channel filter → country filter → sort in sequence, producing a new filtered list.
- Sort by recording date treats `null` recording dates as `new Date(0)`.
- `refreshVideos()` maintains existing filter/sort state after receiving new data.
- Computed getters: `availableChannels` and `availableCountries` extract unique sorted values from the full (unfiltered) video list.

**Screens & Components:**

#### `main.tsx` — Video List Screen
- `SafeAreaView` with `StatusBar` configured for Android padding.
- **Header** with "YouTube Videos" title and a red Logout button. Logout flow: confirmation `Alert`, then dispatches sign-out, then `router.replace('/login')`.
- **Controls bar** (row of buttons below header):
  - **Filter button**: opens `FilterModal`, shows "(Active)" label when filters are applied
  - **Sort button**: opens `SortModal`, shows current sort field ("Published" or "Recorded")
  - **Refresh button** (blue): force-refreshes from API. Also available via pull-to-refresh (`RefreshControl`)
  - **View Map button** (green): navigates to `/map`
- **Video count** display: "Showing X of Y videos" when filters are active.
- **Video list** (`FlatList`) where each `VideoItem` card displays:
  - Thumbnail image (loaded via `expo-image` with placeholder and error fallback)
  - Video title (2-line max)
  - Channel name (1-line)
  - Publication date (formatted `YYYY-MM-DD`)
  - Recording date (if available, formatted `YYYY-MM-DD`)
  - Location: city and country (if available), GPS coordinates (if available)
  - Tags: up to 5 shown inline, with "+N more" indicator for overflow
  - Tapping opens video: tries YouTube app deep link first (`youtube://` on iOS, `vnd.youtube:` on Android), falls back to browser URL via `Linking`
- **Loading state**: centered `ActivityIndicator` with "Loading videos..." text
- **Empty state**: message with suggestion to pull-to-refresh or check API key
- **Error state**: shows error message with a retry button

#### `FilterModal` (`src/features/videos/presentation/components/FilterModal.tsx`)
- Full-screen modal with slide animation (`presentationStyle="pageSheet"`)
- Two sections: "Source Channel" and "Country"
- Each section has an "All" option plus dynamically populated options from the video data
- Selected option highlighted in blue (`#4285F4`) with white text
- Footer with "Clear All" (resets both filters) and "Apply Filters" buttons
- Local state for selections, synced with store on apply

#### `SortModal` (`src/features/videos/presentation/components/SortModal.tsx`)
- Full-screen modal with slide animation
- "Sort By" section: Publication Date or Recording Date (with descriptions)
- "Order" section: Newest First or Oldest First (with descriptions)
- Preview section showing "Current Selection" summary
- Footer with "Apply Sort" button
- When sorting by recording date, videos without a recording date fall back to their publication date

#### `map.tsx` — Map Screen
- Uses `react-native-maps` with **OpenStreetMap** tiles via `UrlTile` overlay.
- Header with back button ("< Back"), title "Video Locations".
- Displays only videos that have valid coordinates (`hasCoordinates` check).
- **Markers**: Custom markers at each video's GPS location.
- **Auto-fit bounds**: After loading, the map automatically pans and zooms to fit all markers with padding using `fitToCoordinates`.
- **Marker interaction**: Tapping a marker shows a **bottom sheet** (`@gorhom/bottom-sheet`) at 25% screen height containing:
  - Video thumbnail
  - Title, channel name
  - Publication date and recording date
  - Location info (city, country, GPS coordinates)
  - Tags (first 5)
  - "Watch on YouTube" button (red `#FF0000`) that launches the video
- Bottom sheet is dismissible by swiping down.
- Wrapped in `GestureHandlerRootView` for gesture support.
- Handles edge cases: no videos with location data (shows informational message with refresh button).

##### OpenStreetMap Tile Usage Policy Compliance
The app must comply with the [OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) to avoid request rejection or blocking:
- **User-Agent identification:** The `UrlTile` component must include a unique, identifiable `User-Agent` header (e.g., `dev.elainedb.rn_claude/1.0`) in all tile requests. This is **mandatory** — requests without a proper User-Agent are rejected. On Android, also set the `Referer` header. Configure via `UrlTile`'s `tileSize`, `zIndex` and custom headers props, or via a global `fetch` interceptor.
- **Tile caching:** Enable tile caching to avoid re-downloading the same tiles. Use `react-native-maps`' built-in `shouldReplaceMapContent` and `maximumZ`/`minimumZ` props to limit tile requests. Configure HTTP-level caching (e.g., via a custom `NSURLCache` on iOS or `OkHttp` cache on Android) that respects the server's cache directives. Never send `Cache-Control: no-cache` or `Pragma: no-cache` headers.
- **Rate limiting:** Do not aggressively prefetch tiles. Rely on the map's default on-demand tile loading as the user pans/zooms. Avoid programmatic tile prefetch loops.
- **No bulk downloading:** Only request tiles visible in the current viewport. Do not preload large tile regions.

---

## 7. Navigation Structure

File-based routing via Expo Router with stack navigation:

```
app/
  _layout.tsx    — Root Stack with ThemeProvider (light/dark), initialRouteName: 'login'
  index.tsx      — Redirect to /login
  login.tsx      — Google Sign-In screen
  main.tsx       — Video list with controls
  map.tsx        — Map view with markers
```

All screens have `headerShown: false` (custom headers). Navigation uses `router.replace` for login/logout (no back) and `router.push`/`router.back` for main-to-map transitions.

---

## 8. Performance Monitoring

### Dependencies
- `@react-native-firebase/app`
- `@react-native-firebase/perf`

### Integration
- Firebase Performance is initialized in the app entry point alongside the DI container.
- Automatic monitoring of app startup time, HTTP requests, and screen rendering is enabled by including the dependency.

---

## 9. Dependencies

### Runtime
| Package | Purpose |
|---|---|
| `expo` ~54 | Expo framework |
| `react-native` 0.81 | React Native runtime |
| `react` 19 | React framework |
| `expo-router` | File-based navigation |
| `expo-image` | Optimized image loading |
| `expo-sqlite` | SQLite local database |
| `@react-native-google-signin/google-signin` | Google authentication |
| `@react-native-firebase/app` | Firebase initialization |
| `@react-native-firebase/perf` | Firebase Performance Monitoring |
| `zustand` | State management |
| `zod` | Runtime API response validation |
| `react-native-maps` | Native map rendering |
| `@gorhom/bottom-sheet` | Map screen video detail sheet |
| `react-native-gesture-handler` | Gesture support for bottom sheet |
| `react-native-reanimated` | Animations for bottom sheet |
| `react-native-safe-area-context` | Safe area insets |

### Dev
| Package | Purpose |
|---|---|
| `typescript` | TypeScript compiler |
| `jest` + `ts-jest` | Testing framework |
| `@testing-library/react-native` | Component testing utilities |
| `msw` | API mocking for tests |
| `eslint` + `@typescript-eslint/*` | Linting |
| `prettier` | Code formatting |

---

## 10. Build & Run Commands

```bash
npm install                              # Install dependencies
cp src/config/auth-config.template.ts src/config/auth-config.ts  # Create auth config
cp src/config/api-config.template.ts src/config/api-config.ts    # Create API config
# Edit both config files with real values
npx expo prebuild                        # Generate native projects
npx expo run:android                     # Run on Android
npx expo run:ios                         # Run on iOS
npm test                                 # Run tests
npx ts-node scripts/ensure-config.ts     # Generate CI placeholder configs
```

---

## 11. YouTube Data API Usage

The app uses two YouTube Data API v3 endpoints:

1. **Search** (`GET https://www.googleapis.com/youtube/v3/search`):
   - Params: `part=snippet`, `channelId=<id>`, `type=video`, `order=date`, `maxResults=50`, `key=<apiKey>`, `pageToken=<token>`
   - Used to discover videos per channel. **Exhaustive pagination:** for each channel, follow `nextPageToken` in a loop until the response contains no `nextPageToken`, ensuring all videos are fetched. There is no artificial page limit.

2. **Videos** (`GET https://www.googleapis.com/youtube/v3/videos`):
   - Params: `part=snippet,recordingDetails`, `id=<comma-separated IDs, max 50 per request>`, `key=<apiKey>`
   - Used to fetch detailed metadata: tags, recording location (GPS + description), recording date.
   - Video IDs are batched in groups of 50 from search results.

Reverse geocoding is applied to videos with GPS coordinates to derive human-readable city/country names (see Reverse Geocoding in section 6.2).

---

## 12. Code Quality & CI

### ESLint & Prettier
- ESLint with `@typescript-eslint` for strict TypeScript linting.
- Prettier for consistent code formatting.
- Both run as pre-commit checks.

### Jest Coverage
- Coverage reports generated via `jest --coverage` (Istanbul).
- Coverage thresholds enforced in `jest.config.ts`.

### Unit Tests
- Located in `__tests__/` directories alongside source files.
- Use `@testing-library/react-native` for component tests.
- Use `msw` (Mock Service Worker) for API mocking in integration tests.
- Zustand stores tested by calling actions and asserting state.

### Utility Functions (`src/utils/string-helpers.ts`)
- `isPalindrome(input)` — ignores non-alphanumeric characters, case-insensitive.
- `countWords(input)` — splits on whitespace regex.
- `reverseWords(input)` — reverses word order.
- `capitalizeWords(input)` — title-cases each word.
- `removeVowels(input)` — strips vowels (case-insensitive regex).
- `isValidEmail(email)` — validates email format via regex.

Tests in `src/utils/__tests__/string-helpers.test.ts` cover all utility functions.

---

## 13. Common Agent Mistakes

This section documents recurring mistakes that AI agents make when building this project. Address these proactively to avoid build failures and runtime issues.

### 13.1 AsyncStorage Maven Resolution Failure

**Problem:** `@react-native-async-storage/async-storage` version 3.x introduces a `shared_storage` native module (`org.asyncstorage.shared_storage:storage-android:1.0.0`) that requires a Maven repository not available publicly. The Android build fails with:

```
Could not find org.asyncstorage.shared_storage:storage-android:1.0.0.
```

This happens when agents install the latest version (3.x) of AsyncStorage, which is incompatible with standard Gradle repository configurations.

**Fixes (choose one):**
1. **Pin to 2.x (recommended):** Downgrade `@react-native-async-storage/async-storage` to `2.1.2` or `2.2.0` (Expo 54's bundled version). Version 2.x works out of the box without additional Maven repositories. Update `package.json` and run `npm install`.
2. **Add the bundled local Maven repository:** If 3.x is required, add the AsyncStorage local Maven repo to `android/build.gradle`:
   ```groovy
   allprojects {
       repositories {
           maven { url "$rootDir/../node_modules/@react-native-async-storage/async-storage/android/local_repo" }
       }
   }
   ```
   This points Gradle to the bundled `local_repo` inside the AsyncStorage package, which contains the `org.asyncstorage.shared_storage:storage-android` artifact.

### 13.2 YouTube Video Deep Links Fail on Android 11+

**Problem:** On Android 11 (API 30) and newer, `Linking.canOpenURL()` returns `false` for most app-specific URL schemes (e.g., `youtube://`, `vnd.youtube:`) due to package visibility restrictions. The OS hides information about installed apps unless specific `<queries>` tags are declared in `AndroidManifest.xml`, which is difficult to manage in Expo. As a result, the video open logic incorrectly concludes the YouTube app is not installed and either fails silently or shows an error.

**Fix:** Do not use `Linking.canOpenURL()` to check before opening. Instead, directly attempt `Linking.openURL()` with the deep link and catch failures, falling back through URL schemes sequentially:

```typescript
const openVideo = async (videoId: string) => {
  const isIOS = Platform.OS === 'ios';
  const appUrl = isIOS ? `youtube://watch?v=${videoId}` : `vnd.youtube:${videoId}`;
  const altAppUrl = `youtube://watch?v=${videoId}`;
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    await Linking.openURL(appUrl);
  } catch (e1) {
    if (!isIOS) {
      try {
        await Linking.openURL(altAppUrl);
      } catch (e2) {
        try {
          await Linking.openURL(webUrl);
        } catch (e3) {
          Alert.alert('Error', 'Cannot open video.');
        }
      }
    } else {
      try {
        await Linking.openURL(webUrl);
      } catch (e2) {
        Alert.alert('Error', 'Cannot open video.');
      }
    }
  }
};
```

This applies to **both** `components/VideoItem.tsx` (list cards) and `app/map.tsx` (bottom sheet "Watch on YouTube" button). The same logic must be used in both places. Also clean up any non-standard URL patterns like `vnd.youtube.com/...` which cause unnecessary failures.

### 13.3 Map Markers Not Clickable (WebView + Bottom Sheet Gesture Conflict)

**Problem:** When using `react-native-webview` with Leaflet.js for the map and `@gorhom/bottom-sheet` for the detail panel, marker taps on Android frequently do nothing. The root cause is **gesture handler interference**: `@gorhom/bottom-sheet` uses `react-native-gesture-handler` which intercepts touch events that should reach the WebView. The `WebView.postMessage()` → `onMessage` bridge for marker clicks becomes unreliable, and pointer events get cancelled before reaching the Leaflet markers.

**Fixes (in order of reliability):**
1. **Replace `@gorhom/bottom-sheet` with a plain animated overlay:** Remove `@gorhom/bottom-sheet` from the map screen entirely. Instead, use a simple `Animated.View` positioned absolutely at the bottom of the screen that slides in/out when a marker is tapped. This eliminates the gesture handler conflict:
   - Marker tap posts `{ type: 'markerClick', videoId }` from the WebView via `ReactNativeWebView.postMessage`
   - React Native receives it via `onMessage`, sets the selected video in state
   - A plain animated bottom panel slides up with video info and the YouTube button
   - Tapping a dimmed backdrop (or a close button) dismisses it
2. **Use `injectJavaScript` instead of `postMessage` for marker data:** Replace the `WebView.postMessage()` call from React Native to WebView with `webViewRef.injectJavaScript()` calling a page-level function like `window.__setMarkers(...)`. This is more reliable on Android than the `postMessage` bridge for the RN-to-WebView direction.
3. **Add load/error diagnostics:** Have the map HTML emit explicit messages on Leaflet load success/failure via `ReactNativeWebView.postMessage({ type: 'mapReady' })` so the app can detect when the WebView failed to load Leaflet assets from the CDN (a common silent failure on Android WebView).
