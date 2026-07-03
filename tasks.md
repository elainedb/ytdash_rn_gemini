# Tasks: YouTube Dashboard ("ytdash") - React Native (Expo)

## Phase 1: Setup & Custom Native Module (Shared Infrastructure)

- [ ] T001 Scaffold local Expo native module `test-config` to read launch intent extras.
- [ ] T002 Implement Kotlin `getTestConfig` in `modules/test-config/android/src/main/java/expo/modules/testconfig/TestConfigModule.kt` to extract Android intent extras.
- [ ] T003 Implement TypeScript wrapper for `test-config` in `modules/test-config/src/TestConfigModule.ts` and expose it.
- [ ] T004 Install required npm packages: `react-native-webview` and `@react-native-async-storage/async-storage`.

## Phase 2: Foundational Architecture & Core State

- [ ] T005 Create types and model definitions for Youtube Videos, Channels, and AppState.
- [ ] T006 Implement configuration management helper (reads launch config from `test-config` native module).
- [ ] T007 Implement whitelisted emails loading and checking utility.
- [ ] T008 Implement local caching service using `@react-native-async-storage/async-storage` with 24-hour TTL and stale-fallback on network error.
- [ ] T009 Implement API client to fetch YouTube search list and video details with full page-token pagination across all configured channels.

## Phase 3: Iteration 1 - Authentication & Whitelist (AC-LOGIN-01, AC-LOGIN-02, AC-LOGIN-03)

- [ ] T010 Implement beautiful, modern Login Screen (`screen_login`) with Google Button (`login_google_button`) and Whitelist Error view (`login_error_message`).
- [ ] T011 Implement Mock Auth path (when `uiTestMode` is true and `mockAuthEmail` is set) to skip real Google Login and sign in directly.
- [ ] T012 Implement Logout control (`logout_button`) returning user to the login screen.

## Phase 4: Iteration 2 - Video List & Open Link (AC-LIST-01, AC-LIST-02, AC-LIST-03, AC-COUNT-01, AC-LINK-01)

- [ ] T013 Implement main Screen UI (`screen_home`) containing the scrollable list container (`video_list`) and individual list items (`video_list_item`).
- [ ] T014 Implement total video count display (`video_count`) in the header title showing the correct aggregated count (e.g. 8).
- [ ] T015 Implement Pull-to-refresh (`refresh_control`) to re-trigger network fetches, update state, and re-cache.
- [ ] T016 Implement "Open in YouTube" capturing logic: when `captureExternalLinks` is true, display the destination URL in `external_open_url` instead of launching; when false, launch via `Linking.openURL` and show `external_open_error` on failure.

## Phase 5: Iteration 3 - Caching, Filtering & Sorting (AC-CACHE-01, AC-FILTER-01, AC-SORT-01)

- [ ] T017 Implement category filter UI (`filter_button` and option list) that swaps out the main list while open to prevent text collision. Filter by channel labels from config.
- [ ] T018 Implement sorting UI (`sort_button` and options ending in proper keywords: `Date — newest`, `Title — A to Z`, etc.) that swaps out the main list while open.
- [ ] T019 Integrate Local Caching Service so the app reads from cache on startup and uses cached data during network failure without blocking the screen.

## Phase 6: Iteration 4 - Interactive Map (AC-MAP-01, AC-MAP-02, AC-MAP-03)

- [ ] T020 Implement Map Screen navigation button (`map_nav_button`) and Map Screen (`screen_map`) rendering OpenStreetMap via a beautiful `WebView` + Leaflet.
- [ ] T021 Implement HTML markers inside Leaflet (loaded from local HTML or inject JS) and postMessage communication from WebView back to RN for marker selection.
- [ ] T022 Implement a reachable native marker overlay row below the map (horizontal chips or list of `map_marker`s) so that automation tools can initiate marker taps.
- [ ] T023 Implement the custom bottom sheet detail view (`detail_bottom_sheet`) with `detail_video_url` and `detail_open_youtube_button`.
- [ ] T024 Implement reverse-geocoding using Nominatim with resilient caching (keyed by 3-decimal coords) and user-agent settings.

## Phase 7: Polish & Self-Validation

- [ ] T025 Review design elements and apply high-end visual aesthetics (vibrant color palettes, custom card designs, premium fonts, subtle hover/tap effects).
- [ ] T026 Compile Release APK using Expo native build.
- [ ] T027 Run Maestro E2E test flows against the local mock API server.
- [ ] T028 Wire up Real Mode configuration (using whitelisted emails and API key).
- [ ] T029 Write build report and signal completion with `.build-complete`.
